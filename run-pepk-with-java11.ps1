# Run PEPK with Java 11 - use from pepk-run folder or set $pepkDir
$pepkDir = "C:\Users\a0534\OneDrive\שולחן העבודה\pepk-run"
$java11 = "C:\Program Files\Eclipse Adoptium\jdk-11.0.30.7-hotspot\bin\java.exe"

if (-not (Test-Path $java11)) {
    Write-Host "Java 11 not found at: $java11" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $pepkDir)) {
    Write-Host "Folder not found: $pepkDir" -ForegroundColor Red
    exit 1
}

Set-Location $pepkDir
& $java11 -jar "pepk (1).jar" --keystore=signing.keystore --alias=my-key-alias --output=private_key.zip --include-cert --rsa-aes-encryption --encryption-key-path="encryption_public_key (1).pem"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Done. private_key.zip created in: $pepkDir" -ForegroundColor Green
}
