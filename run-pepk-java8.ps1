# PEPK - needs Java 11+ (pepk.jar class version 55). ASCII only.
$ErrorActionPreference = "Stop"

$DOWNLOADS = [Environment]::GetFolderPath("UserProfile") + "\Downloads"
$PEM = $DOWNLOADS + "\encryption_public_key.pem"

# Prefer Java 11 or 17 (pepk.jar requires 11+). Java 8 too old.
$JAVA = $null
$adoptium = "C:\Program Files\Eclipse Adoptium"
if (Test-Path $adoptium) {
    $dirs = Get-ChildItem $adoptium -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "jdk-(11|17)" } | Sort-Object Name -Descending
    foreach ($d in $dirs) {
        $j = Join-Path $d.FullName "bin\java.exe"
        if (Test-Path $j) { $JAVA = $j; break }
    }
}
if (-not $JAVA -and $env:JAVA_HOME) {
    $j = Join-Path $env:JAVA_HOME "bin\java.exe"
    if (Test-Path $j) { $JAVA = $j }
}
if (-not $JAVA) {
    $javaInPath = Get-Command java -ErrorAction SilentlyContinue
    if ($javaInPath) { $JAVA = $javaInPath.Source }
}

# Find "Google Play package" folder (avoids Hebrew in script)
$SOURCE = $null
foreach ($dir in (Get-ChildItem $DOWNLOADS -Directory -ErrorAction SilentlyContinue)) {
    if ($dir.Name -like "*Google Play*package*") {
        $src = Join-Path $dir.FullName "source"
        if (Test-Path $src) { $SOURCE = $src; break }
    }
}
if (-not $SOURCE) {
    Write-Host "Error: No 'Google Play package...\source' folder in Downloads." -ForegroundColor Red
    exit 1
}

Write-Host "=== PEPK (Java 11+ required) ===" -ForegroundColor Cyan
Write-Host ""

if (-not $JAVA -or -not (Test-Path $JAVA)) {
    Write-Host "Error: Java 11 or 17 not found." -ForegroundColor Red
    Write-Host "  Install JDK 11 from https://adoptium.net (JDK 11 - LTS, Windows x64)" -ForegroundColor Gray
    Write-Host "  Or JDK 17. PEPK no longer runs on Java 8." -ForegroundColor Gray
    exit 1
}
$oldEA = $ErrorActionPreference
$ErrorActionPreference = 'SilentlyContinue'
$ver = & $JAVA -version 2>&1 | Out-String
$ErrorActionPreference = $oldEA
if ($ver -match '"1\.8\.') {
    Write-Host "Error: Java 8 detected. PEPK needs Java 11+." -ForegroundColor Red
    Write-Host "  Install JDK 11 from https://adoptium.net" -ForegroundColor Gray
    exit 1
}

$PEPK_JAR = Join-Path $SOURCE "pepk.jar"
if (-not (Test-Path $PEPK_JAR)) {
    $PEPK_JAR = Join-Path $DOWNLOADS "pepk.jar"
}
if (-not (Test-Path $PEPK_JAR)) {
    Write-Host "Error: pepk.jar not found in source folder or in Downloads." -ForegroundColor Red
    Write-Host "  Put pepk.jar in: $SOURCE" -ForegroundColor Gray
    Write-Host "  Or in: $DOWNLOADS" -ForegroundColor Gray
    exit 1
}

if (-not (Test-Path $PEM)) {
    Write-Host "Error: encryption_public_key.pem not in: $PEM" -ForegroundColor Red
    exit 1
}

$KEYSTORE = $null
foreach ($name in @("signingKey.keystore", "upload-key.keystore", "release.keystore")) {
    $p = Join-Path $SOURCE $name
    if (Test-Path $p) { $KEYSTORE = $p; break }
}
if (-not $KEYSTORE) {
    Write-Host "Error: No .keystore in source folder." -ForegroundColor Red
    Get-ChildItem $SOURCE -Filter "*.keystore" -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_.Name }
    exit 1
}

$OUTPUT = Join-Path $SOURCE "private_key.zip"
Write-Host "Java: $JAVA"
Write-Host "Keystore: $KEYSTORE"
Write-Host "Output: $OUTPUT"
Write-Host ""
Write-Host "When prompted, enter your keystore password (same twice if asked)."
Write-Host ""

Set-Location $SOURCE
& $JAVA -jar $PEPK_JAR `
    --keystore="$KEYSTORE" `
    --alias=my-key-alias `
    --output="$OUTPUT" `
    --include-cert `
    --rsa-aes-encryption `
    --encryption-key-path="$PEM"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "PEPK failed. Try alias: upload or key0 if different." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Done. Created: $OUTPUT" -ForegroundColor Green
Write-Host "Upload to Google Play Console > App signing > Upload new key."
