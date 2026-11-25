# Mimie sitesini yayınlar (Vercel + GitHub Pages) ve doğrular. Çıktı en fazla 3 satır.
# Kullanım: powershell -File scripts\yayinla.ps1 -Mesaj "v35: ..."   (klasöre _*.zip konduysa önce açar)
# Ne yapar: _*.zip'leri açıp siler -> git commit+push (Pages) -> vercel deploy --prod -> iki adreste index ve bir varlık 200 mü kontrol eder (kendi bekler/yeniden dener).
# Kontrol edilecek dosya -Kontrol ile verilebilir (varsayılan assets/real/dragon.webp).
param([string]$Mesaj = "guncelleme", [string]$Kontrol = "assets/real/dragon.webp")
$ErrorActionPreference = 'SilentlyContinue'
$p = Split-Path $PSScriptRoot -Parent; Set-Location $p
Get-ChildItem $p -Filter '_*.zip' | ForEach-Object { Expand-Archive $_.FullName -DestinationPath $p -Force; Remove-Item $_.FullName }
git add -A 2>$null | Out-Null
git -c user.name="Ahmet Ezbet" -c user.email="ezbetahmet82@gmail.com" commit -q -m $Mesaj -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" 2>$null | Out-Null
git push -q 2>$null | Out-Null
$log = "$env:TEMP\mimie-deploy.log"
cmd /c "npx --yes vercel@latest deploy --prod --yes --scope ahmetezbets-projects > `"$log`" 2>&1"
$dep = if (Select-String -Path $log -Pattern 'Aliased' -Quiet) { 'vercel: OK' } else { 'vercel: HATA (' + $log + ')' }
$sonuc = @()
foreach ($u in 'https://mimie3d.vercel.app/', 'https://ahmetezbet.github.io/mimie/') {
  $ok = $false
  for ($i = 0; $i -lt 18 -and -not $ok; $i++) {
    try { $a = (Invoke-WebRequest "$u`?x=$(Get-Random)" -UseBasicParsing -TimeoutSec 20).StatusCode; $b = (Invoke-WebRequest ($u + $Kontrol) -Method Head -UseBasicParsing -TimeoutSec 20).StatusCode; $ok = ($a -eq 200 -and $b -eq 200) } catch {}
    if (-not $ok) { Start-Sleep 10 }
  }
  $sonuc += "$u " + $(if ($ok) { 'OK' } else { 'HATA' })
}
$dep; $sonuc
