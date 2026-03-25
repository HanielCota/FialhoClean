# Sobre o FialhoClean

**FialhoClean** é um aplicativo desktop nativo para Windows, construído com **Tauri 2 + Rust + React + TypeScript**. Ele reúne em uma única interface dark-mode as quatro operações mais importantes para manter o sistema saudável: limpeza de arquivos desnecessários, otimização de desempenho, remoção de bloatware e reparo do sistema operacional.

> Zero Electron. Zero overhead. Binário final abaixo de **10 MB**, sem runtime Node.js ou WebView pesado.

---

## Visão geral dos módulos

### Dashboard

A tela inicial exibe um painel de monitoramento em tempo real do sistema:

- **CPU** — uso percentual atual do processador
- **RAM** — memória utilizada vs. total disponível
- **Disco** — espaço ocupado e livre na unidade principal
- **Uptime** — tempo de atividade desde o último boot
- **Indicador de saúde do PC** — avalia o estado geral e exibe um score visual
- **Quick Scan** — botão de limpeza rápida que, ao ser clicado, seleciona automaticamente todas as categorias padrão e inicia a varredura diretamente na tela do Cleaner

---

### Limpeza (Cleaner)

O módulo de limpeza escaneia **16 categorias em paralelo** usando o runtime assíncrono Tokio no backend Rust. A varredura é por categoria (um `invoke` por categoria), o que permite exibir progresso individual em tempo real.

#### Categorias escaneadas

| Categoria | O que remove |
|-----------|-------------|
| **Arquivos Temporários** | Conteúdo de `%TEMP%` e `C:\Windows\Temp` |
| **Cache de Navegadores** | Cache e Code Cache do Chrome, Edge e Firefox (perfis detectados automaticamente) |
| **Lixeira** | Todos os arquivos na Lixeira do Windows (todos os drives) |
| **Logs Antigos** | Arquivos `.log` em `C:\Windows\Logs` e `%TEMP%` |
| **Prefetch** | Arquivos `.pf` em `C:\Windows\Prefetch` |
| **Cache do Windows Update** | Downloads pendentes em `SoftwareDistribution\Download` |
| **Otimização de Entrega** | Cache do Delivery Optimization (`SoftwareDistribution\DeliveryOptimization`) |
| **Relatórios de Erro** | Pastas WER (Windows Error Reporting) em `%LOCALAPPDATA%` e `%PROGRAMDATA%` |
| **Cache de Miniaturas** | Arquivos `thumbcache_*.db` do Explorer |
| **Cache de Ícones** | Arquivos `iconcache_*.db` do Explorer |
| **Memory Dumps** | Arquivos em `C:\Windows\Minidump` e o arquivo `C:\Windows\MEMORY.DMP` |
| **Cache do Discord** | Cache, Code Cache e GPUCache do Discord |
| **Cache do Spotify** | Pasta `Storage` do Spotify em `%LOCALAPPDATA%` |
| **Cache do Steam** | `depotcache`, `logs` e `dumps` do Steam (x86, x64 e LOCALAPPDATA) |
| **Arquivos Recentes** | Atalhos em `%APPDATA%\Microsoft\Windows\Recent` |
| **Cache DNS** | Executa `ipconfig /flushdns` para limpar o cache de resolução de nomes |

#### Fluxo de uso

1. **Selecionar categorias** — o usuário escolhe quais categorias escanear (ou usa "Selecionar tudo")
2. **Escanear** — progresso individual por categoria mostrado em tempo real
3. **Revisar resultados** — lista dos arquivos encontrados com tamanho por categoria
4. **Limpar** — remoção paralela com semáforo de até 32 operações simultâneas
5. **Tela de sucesso** — exibe total de arquivos deletados, espaço liberado e detalhamento por categoria

#### Segurança da limpeza

Toda path recebida do frontend é validada no Rust antes de qualquer exclusão:
- Rejeita null bytes
- Rejeita caminhos relativos e traversal com `..`
- Rejeita caminhos fora do escopo esperado para a categoria
- Verifica reparse points (symlinks/junctions) imediatamente antes da deleção para fechar janela TOCTOU (Time-of-Check-Time-of-Use)

---

### Otimizador (Optimizer)

O módulo de otimização está dividido em quatro abas, cada uma com controles dedicados.

#### Aba Boot

Gerencia os **programas de inicialização** (startup items):

- Lista todos os programas que iniciam com o Windows (lidos do registro via `HKCU\...\Run` e `StartupApproved\Run`)
- Cada item exibe nome, caminho do executável e classificação de segurança (**Safe / Caution / Dangerous**)
- Toggle individual para habilitar ou desabilitar cada programa
- Atualização otimista: a UI reflete a mudança imediatamente sem recarregar a lista inteira

#### Aba Performance

| Controle | Descrição |
|---------|-----------|
| **Plano de Energia** | Seleciona entre os planos disponíveis no sistema (Balanceado, Alto Desempenho, etc.) |
| **Ultimate Performance** | Ativa o plano oculto `e9a42b02-d5df-448d-aa00-03f14749eb61` via `powercfg`, eliminando timers de parque de núcleo e micro-latências |
| **Efeitos Visuais** | Alterna entre modo de performance (sem animações) e modo visual completo via chave `VisualEffects` no registro |
| **GPU Hardware-Accelerated GPU Scheduling (HAGS)** | Ativa ou desativa o escalonamento de GPU via registro para reduzir latência em jogos |
| **Otimizador de RAM** | Libera memória em standby forçando o esvaziamento do Working Set dos processos |
| **Game Mode** | Aplica perfil de jogo no Windows com tweaks de latência e prioridade |

#### Aba Privacy

| Controle | Descrição |
|---------|-----------|
| **Network Throttling** | Desativa a limitação de rede do Windows (`NetworkThrottlingIndex` no registro Multimedia SystemProfile) |
| **Telemetria** | Desativa coleta de dados de diagnóstico e uso enviados à Microsoft |
| **Bing Search no Menu Iniciar** | Remove a integração Bing da busca local do Windows |
| **Advertising ID** | Desativa o identificador de publicidade usado para rastreamento por apps UWP |
| **Histórico de Atividades** | Desativa o Timeline e registro de atividades do usuário |
| **Serviço de Localização** | Desativa o serviço de geolocalização do Windows |
| **Tarefas Agendadas** | Lista e permite habilitar/desabilitar tarefas de telemetria agendadas pelo Windows — seção colapsada por padrão com aviso de cautela |

#### Aba Services (Modo Expert)

Gerencia **serviços do Windows** com categorização de risco:

- Seção escondida por padrão atrás de um botão "Mostrar serviços" com banner de aviso
- Cada serviço exibe nome, descrição detalhada e badge de segurança
- **Safe** (verde) — serviços sem impacto funcional para uso doméstico:

| Serviço | O que faz |
|---------|-----------|
| SysMain (Superfetch) | Pré-carrega apps em RAM — pode ser desativado em SSDs |
| DiagTrack | Envia dados de telemetria à Microsoft |
| WSearch | Indexador de busca do Explorer e Menu Iniciar |
| Fax | Serviço de fax via modem |
| PrintNotify | Pop-ups de status de impressora |
| TabletInputService | Teclado virtual e reconhecimento de escrita à mão |
| WMPNetworkSvc | Compartilhamento da biblioteca do Windows Media Player |
| XblAuthManager / XblGameSave / XboxNetApiSvc | Serviços Xbox Live |
| MapsBroker | Atualização de mapas offline |
| RetailDemo | Modo quiosque para lojas |
| lfsvc | Serviço de localização geográfica |
| PhoneSvc | Integração de chamadas por telefone |
| wisvc | Windows Insider Service |
| RemoteRegistry | Acesso remoto ao registro (risco de segurança) |
| TrkWks | Rastreamento de links NTFS em rede |
| dmwappushservice | Roteamento de mensagens WAP (telemetria) |

- **Caution** (laranja) — requerem atenção antes de desativar:

| Serviço | Risco |
|---------|-------|
| Spooler | Desativar impede toda impressão |
| BITS | Pode pausar downloads do Windows Update |
| wuauserv (Windows Update) | Impede patches de segurança |
| ndu | Monitoramento de uso de rede por app |
| WerSvc | Desativa relatórios de erros à Microsoft |

---

### Debloater

Remove **aplicativos pré-instalados** (UWP/MSIX) do Windows:

- Carrega a lista de todos os pacotes AppX instalados no sistema
- Filtra apps comuns de bloatware identificados por nome de pacote
- Badge de aviso em apps críticos do sistema que não devem ser removidos
- Remoção individual ou em lote via PowerShell (`Remove-AppxPackage`)
- Confirmação antes da remoção em lote

---

### Reparo (Repair)

Ferramentas nativas do Windows para diagnóstico e restauração do sistema:

| Ferramenta | Descrição |
|-----------|-----------|
| **SFC (System File Checker)** | Executa `sfc /scannow` — verifica e restaura arquivos de sistema corrompidos. Timeout de 10 minutos. |
| **DISM (RestoreHealth)** | Executa `DISM /Online /Cleanup-Image /RestoreHealth` — repara a imagem do Windows a partir do Windows Update. Timeout de 15 minutos. |
| **Ponto de Restauração** | Cria um ponto de restauração do sistema via PowerShell (`Checkpoint-Computer`) com proteção contra injeção — a descrição é passada via variável de ambiente, nunca interpolada no script |

A saída dos comandos é decodificada corretamente independente do locale/codepage do Windows. Erros de permissão de administrador são detectados e comunicados com mensagem clara.

---

### Configurações (Settings)

- **Idioma** — Português (pt-BR) e English (en), persistido entre sessões
- **Categorias padrão** — quais categorias são selecionadas automaticamente ao abrir o Cleaner ou ao usar o Quick Scan do Dashboard
- **Confirmar antes de limpar** — exibe modal de confirmação antes de iniciar a deleção

---

## Segurança e arquitetura

| Proteção | Como funciona |
|---------|--------------|
| **Backend Rust** | Toda lógica destrutiva (deleção, escrita no registro, PowerShell) reside no backend — o frontend nunca acessa o sistema diretamente |
| **Path allowlist** | Paths do frontend são verificadas contra lista de diretórios permitidos por categoria; paths fora do escopo são rejeitadas com log |
| **TOCTOU** | Reparse points são re-verificados imediatamente antes da deleção para evitar troca de arquivo entre scan e clean |
| **CSP estrita** | A WebView aplica Content Security Policy `self`-only — sem requests externos |
| **Permissões Tauri mínimas** | Somente as capabilities necessárias são declaradas em `capabilities/` |
| **Injeção de PowerShell** | Descrições de restore point são passadas via `$env:FIALHO_RP_DESC` — nunca interpoladas na string de comando |

---

## Stack técnica

| Camada | Tecnologias |
|--------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Zustand, Vite, lucide-react |
| **Backend** | Rust, Tauri 2, Tokio (async runtime), winreg 0.52, sysinfo 0.32 |
| **i18n** | i18next — pt-BR e en |
| **Tooling** | Biome (lint/format), Cargo, GitHub Actions |

---

## Requisitos

- Windows 10 22H2 ou superior (Windows 11 recomendado)
- WebView2 Runtime (pré-instalado no Windows 11; Windows 10 baixa automaticamente)
- Algumas operações (SFC, DISM, serviços, ponto de restauração) requerem execução como Administrador
