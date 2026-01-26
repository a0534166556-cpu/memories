# Run PEPK from ASCII-only path (Java fails with Hebrew in path)
$ErrorActionPreference = "Stop"

$WORK = "C:\pepk-run"
$DOWNLOADS = [Environment]::GetFolderPath("UserProfile") + "\Downloads"
New-Item -ItemType Directory -Force -Path $WORK | Out-Null

# Try to find source and copy files automatically
$sourceDir = $null
foreach ($d in (Get-ChildItem $DOWNLOADS -Directory -ErrorAction SilentlyContinue)) {
    if ($d.Name -like "*Google Play*package*") {
        $sd = Join-Path $d.FullName "source"
        if (Test-Path $sd) { $sourceDir = $sd; break }
    }
}
if ($sourceDir) {
    $copied = 0
    foreach ($f in @("pepk.jar", "signingKey.keystore", "encryption_public_key.pem")) {
        $dst = Join-Path $WORK $f
        if (Test-Path $dst) { continue }
        $src = Join-Path $sourceDir $f
        if (-not (Test-Path $src) -and $f -eq "encryption_public_key.pem") { $src = Join-Path $DOWNLOADS $f }
        if (Test-Path $src) {
            Copy-Item $src $dst -Force -ErrorAction SilentlyContinue
            if (Test-Path $dst) { Write-Host "Copied $f" -ForegroundColor Gray; $copied++ }
        }
    }
    if ($copied -gt 0) { Write-Host "" }
}

$required = @("pepk.jar", "signingKey.keystore", "encryption_public_key.pem")
$missing = @()
foreach ($f in $required) {
    if (-not (Test-Path (Join-Path $WORK $f))) { $missing += $f }
}

if ($missing.Count -gt 0) {
    Write-Host "Copy these files into $WORK :" -ForegroundColor Yellow
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
    Write-Host ""
    Write-Host "From: Downloads\...\source (pepk.jar, signingKey.keystore)" -ForegroundColor Gray
    Write-Host "      Downloads\...\source OR Downloads (encryption_public_key.pem)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "Running PEPK from $WORK ..." -ForegroundColor Cyan
Write-Host "Enter keystore password when prompted." -ForegroundColor Gray
Write-Host ""

Set-Location $WORK
& java -jar pepk.jar --keystore=signingKey.keystore --alias=my-key-alias --output=private_key.zip --include-cert --rsa-aes-encryption --encryption-key-path=encryption_public_key.pem

if ($LASTEXITCODE -ne 0) {
    Write-Host "PEPK failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Done. private_key.zip is in: $WORK" -ForegroundColor Green
Write-Host "Upload it in Play Console > App signing."
