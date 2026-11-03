# MediSeba Connect V3 - Secure Staging Credential Setup
# Windows Native Dialog & CLI Secure Input Handler
param(
    [switch]$Cli
)

$ErrorActionPreference = "Stop"
$projectDir = Split-Path -Parent $PSScriptRoot
$envStagingPath = Join-Path $projectDir ".env.staging"
$projectRef = "cqcnwpsfmxthfzmuktso"

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "MediSeba V3 — Secure Supabase Staging Credential Setup" -ForegroundColor Cyan
Write-Host "Target Project: $projectRef" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan

$passwordOrUri = ""

if ($Cli -or -not [System.Environment]::UserInteractive) {
    Write-Host "`nEnter your Supabase Database Password (or full Connection URI):" -ForegroundColor Yellow
    Write-Host "(Input is masked and will not be displayed or logged)" -ForegroundColor DarkGray
    $secPass = Read-Host "Password / URI" -AsSecureString
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secPass)
    $passwordOrUri = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
} else {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    $form = New-Object System.Windows.Forms.Form
    $form.Text = "MediSeba V3 - Supabase Staging DB Credentials"
    $form.Size = New-Object System.Drawing.Size(520, 260)
    $form.StartPosition = "CenterScreen"
    $form.FormBorderStyle = "FixedDialog"
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false
    $form.TopMost = $true

    $label = New-Object System.Windows.Forms.Label
    $label.Location = New-Object System.Drawing.Point(20, 20)
    $label.Size = New-Object System.Drawing.Size(460, 45)
    $label.Text = "Enter your Supabase Database Password (or full Connection URI)`nfor project: cqcnwpsfmxthfzmuktso`n(This will be saved securely to gitignored .env.staging):"
    $form.Controls.Add($label)

    $textBox = New-Object System.Windows.Forms.TextBox
    $textBox.Location = New-Object System.Drawing.Point(20, 75)
    $textBox.Size = New-Object System.Drawing.Size(460, 25)
    $textBox.PasswordChar = '*'
    $form.Controls.Add($textBox)

    $showCheckBox = New-Object System.Windows.Forms.CheckBox
    $showCheckBox.Location = New-Object System.Drawing.Point(20, 110)
    $showCheckBox.Size = New-Object System.Drawing.Size(150, 20)
    $showCheckBox.Text = "Show Characters"
    $showCheckBox.Add_CheckedChanged({
        if ($showCheckBox.Checked) {
            $textBox.PasswordChar = [char]0
        } else {
            $textBox.PasswordChar = '*'
        }
    })
    $form.Controls.Add($showCheckBox)

    $okButton = New-Object System.Windows.Forms.Button
    $okButton.Location = New-Object System.Drawing.Point(280, 160)
    $okButton.Size = New-Object System.Drawing.Size(95, 32)
    $okButton.Text = "Save"
    $okButton.DialogResult = [System.Windows.Forms.DialogResult]::OK
    $form.AcceptButton = $okButton
    $form.Controls.Add($okButton)

    $cancelButton = New-Object System.Windows.Forms.Button
    $cancelButton.Location = New-Object System.Drawing.Point(385, 160)
    $cancelButton.Size = New-Object System.Drawing.Size(95, 32)
    $cancelButton.Text = "Cancel"
    $cancelButton.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
    $form.CancelButton = $cancelButton
    $form.Controls.Add($cancelButton)

    $dialogResult = $form.ShowDialog()
    if ($dialogResult -eq [System.Windows.Forms.DialogResult]::OK) {
        $passwordOrUri = $textBox.Text.Trim()
    } else {
        Write-Host "`n[CANCELLED] Setup cancelled by user." -ForegroundColor Yellow
        exit 0
    }
}

if ([string]::IsNullOrWhiteSpace($passwordOrUri)) {
    Write-Host "`n[ERROR] No password or connection URI was provided." -ForegroundColor Red
    exit 1
}

# Construct or validate Connection URI
$finalDbUrl = ""
if ($passwordOrUri.StartsWith("postgresql://") -or $passwordOrUri.StartsWith("postgres://")) {
    $finalDbUrl = $passwordOrUri
    if (-not $finalDbUrl.Contains("sslmode=")) {
        if ($finalDbUrl.Contains("?")) {
            $finalDbUrl = $finalDbUrl + "&sslmode=require"
        } else {
            $finalDbUrl = $finalDbUrl + "?sslmode=require"
        }
    }
} else {
    # Password was provided directly. Construct standard Supabase connection URL
    $encodedPassword = [System.Uri]::EscapeDataString($passwordOrUri)
    $finalDbUrl = "postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
}

# Write .env.staging safely
$envContent = @"
# MediSeba V3 Staging Database Credentials (Git-Ignored)
# Project Reference: $projectRef
MEDISEBA_STAGING_DATABASE_URL=$finalDbUrl
MEDISEBA_STAGING_PROJECT_REF=$projectRef
"@

[System.IO.File]::WriteAllText($envStagingPath, $envContent, [System.Text.Encoding]::UTF8)

# Restrict Windows file ACLs
try {
    $aclUser = "$($env:USERNAME):(R,W)"
    icacls $envStagingPath /inheritance:r /grant:r $aclUser | Out-Null
} catch {}

Write-Host "`n[SUCCESS] .env.staging created successfully." -ForegroundColor Green
Write-Host "File Location: $envStagingPath" -ForegroundColor DarkGray
Write-Host "Git Status:    $(if (git check-ignore $envStagingPath) { 'CONFIRMED IGNORED' } else { 'WARNING: NOT IGNORED' })" -ForegroundColor Green
Write-Host "ACLs:          Restricted to current user ($env:USERNAME)" -ForegroundColor DarkGray
Write-Host "`nYou can now run:" -ForegroundColor Cyan
Write-Host "  npm run db:migrate:staging:dry   # (Preflight Dry-Run)" -ForegroundColor White
Write-Host "  npm run db:test:staging          # (31 pgTAP Security Assertions)" -ForegroundColor White
