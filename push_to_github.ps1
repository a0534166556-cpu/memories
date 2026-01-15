# PowerShell script to push all changes to GitHub
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "דוחף את כל השינויים החדשים ל-GitHub" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] מוסיף את כל הקבצים..." -ForegroundColor Yellow
git add -A

Write-Host ""
Write-Host "[2/4] מציג מה נוסף..." -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "[3/4] יוצר commit..." -ForegroundColor Yellow
git commit -m "Add new features: About, Pricing, Login, SaveMemorial, PaymentSuccess, PaymentCancel + Authentication + PayPal Integration + Expiry Warnings"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "Commit נוצר בהצלחה!" -ForegroundColor Green
    Write-Host "עכשיו תצטרך להריץ: git push" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "אין שינויים חדשים ל-commit או שיש שגיאה" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
}

Write-Host ""
