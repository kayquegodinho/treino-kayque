#requires -Version 5.1
<#
.SYNOPSIS
  Backup LOCAL do Atlas Android via ADB, sem root, com cifragem DPAPI do Windows.
.DESCRIPTION
  Lê apenas o diretório WebView privado do Atlas (quando o APK instalado é debugável).
  Não instala, não remove, não limpa dados e não envia nada para nuvem.
  O arquivo cifrado só pode ser aberto com o MESMO usuário do Windows.
  Não substitui a exportação JSON portável do próprio Atlas.
#>
[CmdletBinding()]
param(
  [string]$AdbPath = '',
  [string]$Destination = [IO.Path]::Combine(
    [Environment]::GetFolderPath('MyDocuments'), 'Olimpo-Backups')
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$package = 'com.kayquegodinho.atlas'
$origin = 'app_webview'
$entropy = [Text.Encoding]::UTF8.GetBytes('olimpo-atlas-usb-backup-v1')
function Resolve-Adb {
  if ($AdbPath) {
    if (-not (Test-Path -LiteralPath $AdbPath)) { throw 'ADB não encontrado no caminho informado.' }
    return (Resolve-Path -LiteralPath $AdbPath).Path
  }
  $candidates = @(
    [IO.Path]::Combine((Get-Location).Path,'adb.exe'),
    [IO.Path]::Combine($PSScriptRoot,'adb.exe')
  )
  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) { return $candidate }
  }
  $command = Get-Command adb.exe -ErrorAction SilentlyContinue
  if ($command) { return $command.Source }
  throw 'ADB não encontrado. Abra o PowerShell dentro da pasta platform-tools e repita.'
}
try {
  $adb = Resolve-Adb
  $list = @(& $adb devices)
  if ($LASTEXITCODE -ne 0) { throw 'ADB não conseguiu listar os dispositivos.' }
  $devices = @($list | Where-Object { $_ -match '^\S+\s+device\s*$' })
  if ($devices.Count -ne 1) {
    throw 'Conecte somente um smartphone e autorize a depuração USB. Nenhum dado foi modificado.'
  }

  $installed = @(& $adb shell pm path $package)
  if ($LASTEXITCODE -ne 0 -or -not ($installed -match '^package:')) {
    throw 'Atlas não está instalado com o identificador esperado. Nenhum dado foi modificado.'
  }

  # Apenas APK debugável aceita "run-as". Nunca tentar root ou mudar flags do aparelho.
  $check = @(& $adb shell run-as $package id 2>&1)
  if ($LASTEXITCODE -ne 0 -or -not ($check -match 'uid=')) {
    throw ('O Android não permite backup privado por ADB nesta instalação. ' +
      'Isso é comum em APKs de produção. ' +
      'Use Atlas > Ajustes > Salvar ou recuperar meus dados > Salvar uma cópia dos meus dados. ' +
      'Não desinstale nem limpe os dados do Atlas.')
  }

  $webview = @(& $adb shell run-as $package ls $origin 2>&1)
  if ($LASTEXITCODE -ne 0) {
    throw 'Os dados WebView do Atlas não estão disponíveis via ADB. Nenhum dado foi modificado.'
  }

  Write-Host 'Atlas localizado. Preparando cópia local consistente; não reinstala o aplicativo.'
  # Encerra somente o processo, para evitar captura de LevelDB em gravação.
  & $adb shell am force-stop $package | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Não foi possível encerrar o Atlas para cópia consistente.' }

  $psi = New-Object Diagnostics.ProcessStartInfo
  $psi.FileName = $adb
  $psi.Arguments = 'exec-out run-as ' + $package + ' tar -cf - ' + $origin
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true
  $process = [Diagnostics.Process]::Start($psi)
  if (-not $process) { throw 'Não foi possível iniciar o backup por ADB.' }
  $memory = New-Object IO.MemoryStream
  try {
    $gzip = [IO.Compression.GZipStream]::new(
      $memory, [IO.Compression.CompressionMode]::Compress, $true)
    try {
      # Saída BINÁRIA: não usar redirecionamento > do Windows PowerShell 5.1.
      $process.StandardOutput.BaseStream.CopyTo($gzip)
    } finally {
      $gzip.Dispose()
    }
    $stderr = $process.StandardError.ReadToEnd()
    $process.WaitForExit()
    if ($process.ExitCode -ne 0) {
      throw ('Falha ao ler WebView do Atlas: ' + $stderr.Trim().Substring(
        0, [Math]::Min(300, $stderr.Trim().Length)))
    }
    if ($memory.Length -lt 128) { throw 'Arquivo de backup inesperadamente pequeno.' }
    $gzBytes = $memory.ToArray()
  } finally {
    $memory.Dispose()
    $process.Dispose()
  }

  Add-Type -AssemblyName System.Security
  $protected = [Security.Cryptography.ProtectedData]::Protect(
    $gzBytes, $entropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
  [Array]::Clear($gzBytes, 0, $gzBytes.Length)
  [IO.Directory]::CreateDirectory($Destination) | Out-Null
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $output = Join-Path $Destination ('atlas-webview-' + $stamp + '.tar.gz.dpapi')
  [IO.File]::WriteAllBytes($output, $protected)
  [Array]::Clear($protected, 0, $protected.Length)

  # Validação: testa a leitura e a integridade da cifragem, sem exportar o conteúdo.
  $stored = [IO.File]::ReadAllBytes($output)
  $restored = [Security.Cryptography.ProtectedData]::Unprotect(
    $stored, $entropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
  try {
    if ($restored.Length -lt 128 -or $restored[0] -ne 31 -or $restored[1] -ne 139) {
      throw 'A validação do backup falhou: formato inválido.'
    }
  } finally {
    [Array]::Clear($restored, 0, $restored.Length)
    [Array]::Clear($stored, 0, $stored.Length)
  }
  $hash = (Get-FileHash -LiteralPath $output -Algorithm SHA256).Hash
  Write-Host ''
  Write-Host 'BACKUP_ATLAS_OK' -ForegroundColor Green
  Write-Host ('Arquivo protegido: ' + $output)
  Write-Host ('Tamanho: ' + [Math]::Round((Get-Item -LiteralPath $output).Length / 1MB, 2) + ' MB')
  Write-Host ('SHA-256: ' + $hash)
  Write-Host 'Backup associado ao usuário atual do Windows (DPAPI). Não envie o arquivo a ninguém.'
  Write-Host 'O Atlas pode ser aberto normalmente no smartphone.'
  exit 0
} catch {
  Write-Host ''
  Write-Host 'BACKUP_ATLAS_NAO_CONCLUIDO' -ForegroundColor Yellow
  Write-Host $_.Exception.Message
  Write-Host 'Os dados do smartphone não foram apagados nem substituídos.'
  exit 1
}
