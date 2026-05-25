# Trimly Restoration & Revert Script
# Run this script to undo or revert code modifications if needed.

Write-Host "=============================================" -ForegroundColor Green
Write-Host "          Trimly Code Restoration Utility     " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Choose what you want to revert:"
Write-Host "1) Revert Landing Page & Discovery changes only (Keep calendar/security fixes)"
Write-Host "2) Revert ALL edits from this coding session (Landing Page + Calendar/Security/PCI fixes)"
Write-Host "3) Cancel and keep current code"
Write-Host ""

$choice = Read-Host "Select an option [1-3]"

if ($choice -eq "1") {
    Write-Host "Reverting landing page and design layout changes..." -ForegroundColor Yellow
    git restore src/app/`(marketing`)/layout.tsx
    git restore src/app/`(marketing`)/page.tsx
    if (Test-Path "src/components/ui/card.tsx") {
        Remove-Item "src/components/ui/card.tsx" -Force
    }
    if (Test-Path "src/lib/utils.ts") {
        Remove-Item "src/lib/utils.ts" -Force
    }
    Write-Host "✓ Landing page reverted successfully to original state!" -ForegroundColor Green
} 
elseif ($choice -eq "2") {
    Write-Host "Reverting all modifications (checkout all files & delete new ones)..." -ForegroundColor Yellow
    git restore src/app/`(dashboard`)/dashboard/calendar/page.tsx
    git restore src/app/`(dashboard`)/layout.tsx
    git restore src/app/`(marketing`)/layout.tsx
    git restore src/app/`(marketing`)/page.tsx
    git restore src/app/[salonSlug]/layout.tsx
    git restore src/app/[salonSlug]/page.tsx
    git restore src/lib/api.ts
    
    if (Test-Path "src/components/ui/card.tsx") {
        Remove-Item "src/components/ui/card.tsx" -Force
    }
    if (Test-Path "src/lib/utils.ts") {
        Remove-Item "src/lib/utils.ts" -Force
    }
    Write-Host "✓ All modifications reverted successfully!" -ForegroundColor Green
} 
else {
    Write-Host "Operation cancelled. No files were modified." -ForegroundColor Cyan
}
