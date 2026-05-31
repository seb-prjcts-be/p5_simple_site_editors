<?php
declare(strict_types=1);

/*
 * p5 Sketch Editor — PHP-backed (building block).
 *
 * Een minimale, zelfstandige editor die ECHTE bestanden op schijf bewerkt:
 * multi-file tab-balk, opslaan naar schijf, live preview (het echt geserveerde
 * index.html). Geen framework, geen DB. Geinspireerd op boekentoren's editor,
 * maar ontkoppeld van diens manifest/slug/nav — wijst gewoon naar sketches/.
 *
 * Dit is een SCHRIJVENDE view. Daarom een security-poort:
 *   - alleen loopback (localhost)
 *   - CSRF-token bij opslaan
 *   - doelmap moet binnen sketches/ liggen (realpath-containment)
 *   - bestandsnaam: geen ../  /  \ ; extensie-whitelist
 *
 * Syntax highlighting ligt als latere laag bovenop dit fundament: CodeMirror 5
 * (via CDN) over het codeveld; fromTextArea synct bij opslaan terug naar de
 * textarea, dus de POST hieronder blijft ongewijzigd. Git-autocommit blijft
 * bewust NIET hier.
 */

const ALLOWED_EXT = ['js', 'html', 'css', 'json', 'csv', 'txt', 'md', 'glsl', 'vert', 'frag'];

function fail(int $code, string $msg): never
{
    http_response_code($code);
    header('Content-Type: text/plain; charset=utf-8');
    echo $msg . "\n";
    exit;
}

// --- Security-poort: loopback-only + sessie voor CSRF -----------------------
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
if (!in_array($ip, ['127.0.0.1', '::1', '0:0:0:0:0:0:0:1'], true)) {
    fail(403, 'Editor enkel toegankelijk vanaf localhost (schrijvende view).');
}

function csrf_token(): string
{
    if (empty($_SESSION['ed_csrf'])) {
        $_SESSION['ed_csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['ed_csrf'];
}

function csrf_check(): void
{
    $aangeleverd = (string) ($_POST['csrf'] ?? '');
    $verwacht = (string) ($_SESSION['ed_csrf'] ?? '');
    if ($verwacht === '' || !hash_equals($verwacht, $aangeleverd)) {
        fail(403, 'CSRF-token ontbreekt of ongeldig — schrijfactie geweigerd.');
    }
}

// Root die de bewerkbare sketch-mappen bevat.
$BASE = realpath(__DIR__ . '/sketches');
if ($BASE === false) {
    fail(500, 'Map sketches/ niet gevonden.');
}

// --- Taal (i18n): nl/en, gekozen via ?lang= en onthouden in een cookie -----
$LANGS = ['nl', 'en'];
$lang = $_GET['lang'] ?? ($_COOKIE['ed_lang'] ?? 'nl');
if (!in_array($lang, $LANGS, true)) {
    $lang = 'nl';
}
if (isset($_GET['lang']) && in_array($_GET['lang'], $LANGS, true)) {
    setcookie('ed_lang', $lang, ['expires' => time() + 31536000, 'path' => '/', 'samesite' => 'Lax']);
}
$T = json_decode((string) @file_get_contents(__DIR__ . "/lang/$lang.json"), true) ?: [];
/** Vertaal een sleutel (valt terug op de sleutel zelf). */
$t = fn(string $k): string => (string) ($T[$k] ?? $k);

/** Resolve een sketch-map (relatief t.o.v. $BASE) met containment. */
function resolve_dir(string $base, string $dirRel): string
{
    $dirRel = str_replace('\\', '/', trim($dirRel));
    if ($dirRel === '') {
        $dirRel = '.';
    }
    if (str_contains($dirRel, '..')) {
        fail(400, 'Ongeldige map.');
    }
    $full = realpath($base . '/' . $dirRel);
    $baseN = rtrim(str_replace('\\', '/', $base), '/');
    $fullN = $full === false ? '' : rtrim(str_replace('\\', '/', $full), '/');
    if ($full === false || !is_dir($full)
        || ($fullN !== $baseN && !str_starts_with($fullN, $baseN . '/'))) {
        fail(400, 'Doelmap ligt buiten de toegestane root (geweigerd).');
    }
    return $full;
}

/** Valideer een nieuwe sketch-(map)naam voor "Bewaar als". */
function valideer_sketchnaam(string $name): string
{
    $name = trim($name);
    if (!preg_match('/^[a-z0-9][a-z0-9_-]*$/i', $name)) {
        fail(400, 'Ongeldige sketch-naam — gebruik letters, cijfers, - en _.');
    }
    return $name;
}

/** Valideer een te bewerken bestandsnaam. */
function valideer_bestand(string $file): string
{
    $file = trim($file);
    if ($file === '' || str_contains($file, '..')
        || str_contains($file, '/') || str_contains($file, '\\')) {
        fail(400, 'Ongeldige bestandsnaam.');
    }
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    if (!in_array($ext, ALLOWED_EXT, true)) {
        fail(400, "Bestandstype niet bewerkbaar: $ext");
    }
    return $file;
}

/** Lijst van sketch-folders (één niveau) onder de root, alfabetisch. */
function list_sketches(string $base): array
{
    $out = [];
    foreach (scandir($base) as $f) {
        if ($f === '.' || $f === '..') {
            continue;
        }
        if (is_dir($base . '/' . $f)) {
            $out[] = $f;
        }
    }
    sort($out);
    return $out;
}

/** Verwijder een map recursief (voor "Sketch verwijderen"). */
function rrmdir(string $dir): void
{
    foreach (scandir($dir) as $f) {
        if ($f === '.' || $f === '..') {
            continue;
        }
        $p = $dir . '/' . $f;
        is_dir($p) ? rrmdir($p) : unlink($p);
    }
    rmdir($dir);
}

/** Starter-bestanden voor een nieuwe sketch. */
function starter_html(): string
{
    return "<!DOCTYPE html>\n<html lang=\"nl\">\n<head>\n  <meta charset=\"utf-8\">\n"
        . "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n"
        . "  <link rel=\"stylesheet\" href=\"style.css\">\n"
        . "  <script src=\"https://cdn.jsdelivr.net/npm/p5@2.2.3/lib/p5.min.js\"></script>\n"
        . "</head>\n<body>\n  <script src=\"script.js\"></script>\n</body>\n</html>\n";
}
function starter_css(): string
{
    return "body { margin: 0; background: #fff; }\n";
}
function starter_js(): string
{
    return "function setup() {\n  createCanvas(400, 400);\n  noStroke();\n}\n\n"
        . "function draw() {\n  background(20);\n  fill(255, 0, 125);\n  circle(mouseX, mouseY, 50);\n}\n";
}

// ===========================================================================
// POST — opslaan naar schijf
// ===========================================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $action = (string) ($_POST['action'] ?? 'save');
    $dirRel = (string) ($_POST['dir'] ?? '');
    $dirAbs = resolve_dir($BASE, $dirRel);
    $fileRaw = (string) ($_POST['file'] ?? '');
    $file = $fileRaw === '' ? '' : valideer_bestand($fileRaw);
    $coder = (string) ($_POST['coder'] ?? '');

    // --- Bewaar als: dupliceer de hele sketch onder een nieuwe naam ---------
    if ($action === 'saveas') {
        $newName = valideer_sketchnaam((string) ($_POST['newname'] ?? ''));
        $target = $BASE . '/' . $newName;
        if (file_exists($target)) {
            fail(400, "Sketch bestaat al: $newName");
        }
        if (!mkdir($target)) {
            fail(500, 'Kan de nieuwe map niet aanmaken.');
        }
        // Kopieer alle bestanden (code + assets) uit de bron-sketch.
        foreach (scandir($dirAbs) as $f) {
            if ($f === '.' || $f === '..') {
                continue;
            }
            $src = $dirAbs . '/' . $f;
            if (is_file($src)) {
                copy($src, $target . '/' . $f);
            }
        }
        // Neem de huidige (mogelijk niet-opgeslagen) editor-inhoud mee.
        if ($file !== '' && is_file($target . '/' . $file)) {
            file_put_contents($target . '/' . $file, $coder);
        }
        header('Location: index.php?dir=' . rawurlencode($newName) . '&file=' . rawurlencode($file), true, 303);
        exit;
    }

    // --- Sketch-niveau: nieuwe sketch (lege folder met starter-bestanden) ---
    if ($action === 'newsketch') {
        $name = valideer_sketchnaam((string) ($_POST['newname'] ?? ''));
        $target = $BASE . '/' . $name;
        if (file_exists($target)) {
            fail(400, "Sketch bestaat al: $name");
        }
        if (!mkdir($target)) {
            fail(500, 'Kan de nieuwe sketch-map niet aanmaken.');
        }
        file_put_contents($target . '/index.html', starter_html());
        file_put_contents($target . '/style.css', starter_css());
        file_put_contents($target . '/script.js', starter_js());
        header('Location: index.php?dir=' . rawurlencode($name) . '&file=script.js', true, 303);
        exit;
    }

    // --- Sketch-niveau: de hele folder hernoemen ----------------------------
    if ($action === 'renamesketch') {
        $name = valideer_sketchnaam((string) ($_POST['newname'] ?? ''));
        $to = $BASE . '/' . $name;
        if (file_exists($to)) {
            fail(400, "Sketch bestaat al: $name");
        }
        if (!rename($dirAbs, $to)) {
            fail(500, 'Sketch hernoemen mislukt.');
        }
        header('Location: index.php?dir=' . rawurlencode($name), true, 303);
        exit;
    }

    // --- Sketch-niveau: de hele folder verwijderen --------------------------
    if ($action === 'deletesketch') {
        rrmdir($dirAbs);
        $rest = list_sketches($BASE);
        header('Location: index.php?dir=' . rawurlencode($rest[0] ?? ''), true, 303);
        exit;
    }

    // --- Nieuw (leeg) bestand in de huidige sketch --------------------------
    if ($action === 'newfile') {
        $new = valideer_bestand((string) ($_POST['newname'] ?? ''));
        $p = $dirAbs . '/' . $new;
        if (file_exists($p)) {
            fail(400, "Bestand bestaat al: $new");
        }
        if (file_put_contents($p, '') === false) {
            fail(500, 'Kan bestand niet aanmaken.');
        }
        header('Location: index.php?dir=' . rawurlencode($dirRel) . '&file=' . rawurlencode($new), true, 303);
        exit;
    }

    // --- Hernoem het actieve bestand ---------------------------------------
    if ($action === 'rename') {
        if ($file === '') {
            fail(400, 'Geen actief bestand om te hernoemen.');
        }
        $new = valideer_bestand((string) ($_POST['newname'] ?? ''));
        $from = $dirAbs . '/' . $file;
        $to = $dirAbs . '/' . $new;
        if (!is_file($from)) {
            fail(404, "Bestand niet gevonden: $file");
        }
        if (file_exists($to)) {
            fail(400, "Doelnaam bestaat al: $new");
        }
        if (!rename($from, $to)) {
            fail(500, 'Hernoemen mislukt.');
        }
        header('Location: index.php?dir=' . rawurlencode($dirRel) . '&file=' . rawurlencode($new), true, 303);
        exit;
    }

    // --- Verwijder het actieve bestand -------------------------------------
    if ($action === 'delete') {
        if ($file === '') {
            fail(400, 'Geen actief bestand om te verwijderen.');
        }
        $p = $dirAbs . '/' . $file;
        if (!is_file($p)) {
            fail(404, "Bestand niet gevonden: $file");
        }
        if (!unlink($p)) {
            fail(500, 'Verwijderen mislukt.');
        }
        header('Location: index.php?dir=' . rawurlencode($dirRel), true, 303);
        exit;
    }

    $path = $dirAbs . '/' . $file;
    if (!is_file($path)) {
        fail(404, "Bestand niet gevonden: $file");
    }
    if (file_put_contents($path, $coder) === false) {
        fail(500, 'Kan bestand niet schrijven.');
    }

    header('Location: index.php?dir=' . rawurlencode($dirRel) . '&file=' . rawurlencode($file), true, 303);
    exit;
}

// ===========================================================================
// GET — laden + editor + live preview
// ===========================================================================
$sketches = list_sketches($BASE);
$dirRel = (string) ($_GET['dir'] ?? '');
if ($dirRel === '' || !in_array($dirRel, $sketches, true)) {
    $dirRel = $sketches[0] ?? '';
}

// Geen enkele sketch (alles verwijderd): minimale staat om er een te maken.
if ($dirRel === '') {
    $h = fn($s) => htmlspecialchars((string) $s, ENT_QUOTES);
    ?><!doctype html>
<html lang="<?= $h($lang) ?>">
<head>
<meta charset="utf-8">
<title>p5 editor</title>
<link rel="stylesheet" href="editor.css">
</head>
<body>
<div class="ed-top"><span class="ed-brand">p5 editor</span></div>
<div class="ed-empty">
  <p><?= $h($t('empty_msg')) ?></p>
  <form method="POST" action="index.php">
    <input type="hidden" name="csrf" value="<?= $h(csrf_token()) ?>">
    <input type="hidden" name="action" value="newsketch">
    <input type="text" name="newname" placeholder="<?= $h($t('empty_placeholder')) ?>" autofocus>
    <button type="submit"><?= $h($t('empty_btn')) ?></button>
  </form>
</div>
</body>
</html>
<?php
    exit;
}
$dirAbs = resolve_dir($BASE, $dirRel);

$files = [];
$assets = [];
foreach (scandir($dirAbs) as $f) {
    if ($f === '.' || $f === '..') {
        continue;
    }
    $p = $dirAbs . '/' . $f;
    if (!is_file($p)) {
        continue;
    }
    $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
    if (in_array($ext, ALLOWED_EXT, true)) {
        $files[] = $f;
    } else {
        $assets[] = ['name' => $f, 'size' => filesize($p)];
    }
}

// Logische volgorde: index.html, style.css, script.js eerst, rest alfabetisch.
usort($files, function ($a, $b) {
    $order = ['index.html' => 0, 'style.css' => 1, 'script.js' => 2, 'sketch.js' => 2];
    $oa = $order[$a] ?? 99;
    $ob = $order[$b] ?? 99;
    return $oa !== $ob ? $oa - $ob : strcmp($a, $b);
});

$activeFile = (string) ($_GET['file'] ?? '');
if (!in_array($activeFile, $files, true)) {
    $activeFile = $files[0] ?? '';
}
$content = $activeFile !== '' ? (string) file_get_contents($dirAbs . '/' . $activeFile) : '';

// Libraries uit index.html (externe <script src>).
$libraries = [];
$indexHtml = is_file($dirAbs . '/index.html') ? (string) file_get_contents($dirAbs . '/index.html') : '';
if ($indexHtml !== '' && preg_match_all('/<script\s+[^>]*src=["\']([^"\']+)["\']/i', $indexHtml, $mm)) {
    foreach ($mm[1] as $src) {
        if (str_starts_with($src, 'http') || str_starts_with($src, '//')) {
            $libraries[] = $src;
        }
    }
}

// Preview-URL: relatief t.o.v. deze pagina (bestanden staan onder dezelfde map).
$previewUrl = '';
if (is_file($dirAbs . '/index.html')) {
    $segs = array_map('rawurlencode', explode('/', 'sketches/' . $dirRel));
    $previewUrl = implode('/', $segs) . '/index.html';
}

$h = fn($s) => htmlspecialchars((string) $s, ENT_QUOTES);
// Taal-links behouden de huidige sketch + bestand.
$langUrl = fn($l) => 'index.php?dir=' . rawurlencode($dirRel) . '&file=' . rawurlencode($activeFile) . '&lang=' . $l;
?><!doctype html>
<html lang="<?= $h($lang) ?>">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= $h($activeFile) ?> — p5 editor (php)</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;700&display=swap">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.css">
<link rel="stylesheet" href="editor.css">
</head>
<body>

<div class="ed-top">
  <span class="ed-brand">p5 editor</span>
  <div class="ed-menu">
    <button class="ed-menu-btn" type="button"><?= $h($t('menu_sketch')) ?> &#9662;</button>
    <div class="ed-menu-list">
      <?php foreach ($sketches as $s): ?>
        <a class="ed-menu-link<?= $s === $dirRel ? ' is-current' : '' ?>"
           href="index.php?dir=<?= rawurlencode($s) ?>"><?= $h($s) ?></a>
      <?php endforeach; ?>
      <hr>
      <button type="button" onclick="newSketch()"><?= $h($t('sketch_new')) ?></button>
      <button type="button" onclick="dupSketch()"><?= $h($t('sketch_dup')) ?></button>
      <button type="button" onclick="renameSketch()"><?= $h($t('sketch_rename')) ?></button>
      <button type="button" onclick="deleteSketch()"><?= $h($t('sketch_delete')) ?></button>
    </div>
  </div>
  <div class="ed-menu">
    <button class="ed-menu-btn" type="button"><?= $h($t('menu_file')) ?> &#9662;</button>
    <div class="ed-menu-list">
      <button type="button" onclick="newFile()"><?= $h($t('file_new')) ?></button>
      <button type="button" onclick="saveNow()"><?= $h($t('file_save')) ?> <span class="ed-menu-sc">Ctrl+S</span></button>
      <hr>
      <button type="button" onclick="renameFile()"><?= $h($t('file_rename')) ?></button>
      <button type="button" onclick="deleteFile()"><?= $h($t('file_delete')) ?></button>
    </div>
  </div>
  <span class="ed-dir"><?= $h($dirRel) ?></span>
  <span class="ed-lang">
    <a href="<?= $h($langUrl('nl')) ?>"<?= $lang === 'nl' ? ' class="is-current"' : '' ?>>NL</a>
    <a href="<?= $h($langUrl('en')) ?>"<?= $lang === 'en' ? ' class="is-current"' : '' ?>>EN</a>
  </span>
</div>

<div class="ed-main">
  <div class="ed-left">
    <div class="tab-bar">
      <?php foreach ($files as $f): ?>
        <a class="tab<?= $f === $activeFile ? ' is-active' : '' ?>"
           href="index.php?dir=<?= rawurlencode($dirRel) ?>&file=<?= rawurlencode($f) ?>"><?= $h($f) ?></a>
      <?php endforeach; ?>
    </div>
    <form id="ed-form" class="editor-wrap" method="POST" action="index.php">
      <input type="hidden" name="csrf" value="<?= $h(csrf_token()) ?>">
      <input type="hidden" name="dir" value="<?= $h($dirRel) ?>">
      <input type="hidden" name="file" value="<?= $h($activeFile) ?>">
      <input type="hidden" name="action" id="ed-action" value="save">
      <input type="hidden" name="newname" id="ed-newname" value="">
      <textarea name="coder" id="coder" spellcheck="false"><?= $h($content) ?></textarea>
    </form>
  </div>

  <div class="ed-divider" id="ed-divider" title="Sleep om te verschalen"></div>

  <div class="ed-right">
    <div class="ed-prev-bar">
      <button type="button" onclick="reloadPreview()">&#8635; <?= $h($t('reload_preview')) ?></button>
      <span class="ed-libs">
        <?php if ($libraries): ?>
          <?= count($libraries) ?> <?= $h($t('libs')) ?>: <?= $h(implode(', ', array_map(fn($l) => basename(parse_url($l, PHP_URL_PATH) ?: $l), $libraries))) ?>
        <?php elseif ($assets): ?>
          <?= count($assets) ?> <?= $h($t('assets')) ?>
        <?php else: ?>
          <?= $h($t('no_libs')) ?>
        <?php endif; ?>
      </span>
    </div>
    <?php if ($previewUrl !== ''): ?>
      <iframe id="prev" src="<?= $h($previewUrl) ?>" title="live preview"></iframe>
    <?php else: ?>
      <div class="ed-noprev"><?= $h($t('no_preview')) ?></div>
    <?php endif; ?>
  </div>
</div>

<script>window.T = <?= json_encode($T, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?>;</script>
<?php
// Kies een CodeMirror-mode op basis van de extensie van het actieve bestand.
$cmModes = [
    'js' => 'javascript', 'json' => 'application/json',
    'css' => 'css', 'html' => 'htmlmixed', 'htm' => 'htmlmixed',
];
$activeExt = strtolower(pathinfo($activeFile, PATHINFO_EXTENSION));
$cmMode = $cmModes[$activeExt] ?? null; // overige types: platte tekst
?>
<script>window.ED_MODE = <?= json_encode($cmMode) ?>;</script>
<!-- CodeMirror 5 (syntax highlighting) — modes voor de bewerkbare bestandstypes. Laad vóór editor.js. -->
<script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.js"></script>
<script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/mode/javascript/javascript.js"></script>
<script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/mode/css/css.js"></script>
<script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/mode/xml/xml.js"></script>
<script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/mode/htmlmixed/htmlmixed.js"></script>
<script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/addon/edit/closebrackets.js"></script>
<script src="https://cdn.jsdelivr.net/npm/codemirror@5.65.16/addon/edit/matchbrackets.js"></script>
<script src="editor.js"></script>
</body>
</html>
