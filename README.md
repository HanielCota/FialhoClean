<div align="center">

```
███████╗██╗ █████╗ ██╗     ██╗  ██╗ ██████╗      ██████╗██╗     ███████╗ █████╗ ███╗   ██╗
██╔════╝██║██╔══██╗██║     ██║  ██║██╔═══██╗    ██╔════╝██║     ██╔════╝██╔══██╗████╗  ██║
█████╗  ██║███████║██║     ███████║██║   ██║    ██║     ██║     █████╗  ███████║██╔██╗ ██║
██╔══╝  ██║██╔══██║██║     ██╔══██║██║   ██║    ██║     ██║     ██╔══╝  ██╔══██║██║╚██╗██║
██║     ██║██║  ██║███████╗██║  ██║╚██████╔╝    ╚██████╗███████╗███████╗██║  ██║██║ ╚████║
╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝      ╚═════╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝
```

**Limpeza, otimização e controle total do seu Windows — em um só lugar.**

![Tauri](https://img.shields.io/badge/Tauri-2.x-24C8D8?style=flat-square&logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Rust](https://img.shields.io/badge/Rust-1.80+-CE422B?style=flat-square&logo=rust&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-10%2F11-0078D4?style=flat-square&logo=windows&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-white?style=flat-square)

</div>

---

## Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
  - [Limpeza](#-limpeza)
  - [Otimizador](#-otimizador)
  - [Debloater](#-debloater)
  - [Dashboard](#-dashboard)
- [Stack Técnica](#stack-técnica)
- [Arquitetura](#arquitetura)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Execução](#instalação-e-execução)
- [Build para Produção](#build-para-produção)
- [Segurança](#segurança)
- [Internacionalização](#internacionalização)

---

## Visão Geral

**FialhoClean** é um aplicativo desktop nativo para Windows construído com **Tauri 2 + React 19 + Rust**. Combina um frontend moderno e fluido com um backend de alta performance em Rust para oferecer limpeza real do sistema, otimização de desempenho e remoção de bloatware — tudo numa interface dark mode com design Carbon Black.

A filosofia do projeto é: **zero electron, zero overhead.** O binário final pesa menos de 10 MB e roda nativamente no Windows sem WebView pesado ou runtime Node.js.

---

## Funcionalidades

### 🧹 Limpeza

O módulo de limpeza oferece **16 categorias** escaneadas em paralelo via Tokio, com validação server-side de caminhos para garantir que nenhum arquivo fora do escopo esperado seja deletado.

| # | Categoria | O que limpa | Admin? |
|---|-----------|-------------|--------|
| 1 | **Arquivos Temporários** | `%TEMP%`, `C:\Windows\Temp` | — |
| 2 | **Cache do Navegador** | Chrome, Edge, Firefox (Cache + Code Cache) | — |
| 3 | **Lixeira** | Esvaziamento via Shell API do Windows | — |
| 4 | **Logs Antigos** | Arquivos `.log` em `%TEMP%` e `C:\Windows\Logs` | — |
| 5 | **Cache de Inicialização** | `C:\Windows\Prefetch` | ⚠️ |
| 6 | **Cache do Windows Update** | `SoftwareDistribution\Download` | ⚠️ |
| 7 | **Otimização de Entrega** | `SoftwareDistribution\DeliveryOptimization` | ⚠️ |
| 8 | **Relatórios de Erro** | `%LOCALAPPDATA%\...\WER` + `%PROGRAMDATA%\...\WER` | Parcial |
| 9 | **Cache de Miniaturas** | `thumbcache_*.db` no Explorer | — |
| 10 | **Cache de Ícones** | `iconcache_*.db` no Explorer | — |
| 11 | **Dumps de Memória** | `C:\Windows\Minidump` + `MEMORY.DMP` | ⚠️ |
| 12 | **Cache do Discord** | Cache, Code Cache e GPUCache | — |
| 13 | **Cache do Spotify** | `%LOCALAPPDATA%\Spotify\Storage` | — |
| 14 | **Cache do Steam** | `depotcache`, `logs`, `dumps` | — |
| 15 | **Arquivos Recentes** | `%APPDATA%\Microsoft\Windows\Recent` | — |
| 16 | **Cache DNS** | `ipconfig /flushdns` via comando nativo | — |

**Fluxo de uso:**

```
Selecionar categorias  →  Scan paralelo  →  Revisar resultados  →  Limpar  →  Sucesso
       (step 1)              (step 2)           (step 3)           (step 4)
```

---

### ⚡ Otimizador

Controle granular sobre o desempenho do Windows:

- **Plano de Energia** — alternar entre Economia, Equilibrado e Alto Desempenho via API nativa
- **Efeitos Visuais** — desativar animações e transparência para PCs mais lentos
- **Programas de Inicialização** — ativar/desativar entradas de startup do usuário e do sistema via registro do Windows (`HKCU` e `HKLM`)
- **Serviços em Segundo Plano** — modo avançado para controlar serviços do Windows com indicadores de segurança (Safe / Caution / Dangerous)

---

### 🛡️ Debloater

Remove aplicativos pré-instalados do Windows (UWP/MSIX) via PowerShell com `Remove-AppxPackage`:

- Lista completa de apps instalados com nome, versão e nível de segurança
- Remoção em lote com confirmação
- Badge de **Cuidado** em apps que podem afetar funcionalidades do sistema
- Tela de sucesso com sugestão de executar uma limpeza em seguida

---

### 📊 Dashboard

Visão geral do estado do sistema em tempo real:

- **Saúde do PC** — indicador de estado geral (Bom / Pode Melhorar / Precisa de Atenção)
- **Armazenamento** — espaço livre/usado no disco principal
- **CPU** — uso percentual em tempo real
- **RAM** — uso atual vs total
- **Uptime** — tempo ligado desde o último boot
- **Limpeza Rápida** — scan e limpeza com um clique direto do dashboard
- **Atividade Recente** — histórico das últimas limpezas realizadas

---

## Stack Técnica

### Frontend

| Tecnologia | Versão | Função |
|---|---|---|
| **React** | 19 | UI declarativa com hooks |
| **TypeScript** | 5.9 | Tipagem estática end-to-end |
| **Vite** | 8 | Bundler e dev server (porta 1420) |
| **Tailwind CSS** | 4 | Estilização utility-first |
| **Zustand** | 5 | Estado global reativo |
| **i18next** | 25 | Internacionalização (pt-BR / en) |
| **Lucide React** | 0.577 | Ícones SVG |
| **Inter** | via fontsource | Tipografia |

### Backend

| Tecnologia | Versão | Função |
|---|---|---|
| **Rust** | 1.80+ | Backend nativo de alta performance |
| **Tauri** | 2.x | Bridge frontend ↔ backend, janela nativa |
| **Tokio** | 1 | Runtime async para I/O paralelo |
| **Sysinfo** | 0.32 | Informações de CPU, RAM, disco |
| **Winreg** | 0.52 | Leitura/escrita no registro do Windows |
| **Serde** | 1 | Serialização JSON entre frontend e Rust |
| **Thiserror** | 1 | Tipos de erro ergonômicos |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│                                                             │
│   Views          Hooks            Stores         Services   │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Cleaner  │  │useCleaner │  │cleaner   │  │cleaner   │  │
│  │ Debloater│  │useDebloater│  │debloater │  │debloater │  │
│  │ Optimizer│  │useOptimizer│  │optimizer │  │optimizer │  │
│  │ Dashboard│  │useSystemInfo│ │settings  │  │system    │  │
│  │ Settings │  │useStartup │  │ui        │  └──────────┘  │
│  └──────────┘  └───────────┘  └──────────┘       │         │
│                                                   │ invoke  │
└───────────────────────────────────────────────────┼─────────┘
                                                    │ Tauri IPC
┌───────────────────────────────────────────────────┼─────────┐
│                       Backend (Rust)               │         │
│                                                   │         │
│   Commands              Services          Models  │         │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────┐│         │
│  │scan_categories│  │cleaner::scan     │  │Clean ││         │
│  │clean_files   │  │cleaner::clean    │  │Categ.││         │
│  │get_system_info│  │system_info       │  │File  ││         │
│  │get_startup   │  │optimizer::startup│  │Group ││         │
│  │set_service   │  │optimizer::service│  │Scan  ││         │
│  │get_power_plans│  │debloater         │  │Result││         │
│  │remove_apps   │  └──────────────────┘  └──────┘│         │
│  └──────────────┘                                 │         │
│                          Windows APIs             │         │
│         PowerShell · Registry (winreg) · sysinfo  │         │
└───────────────────────────────────────────────────┴─────────┘
```

### Fluxo de dados

```
UI Event → Hook → Service → invoke() → Tauri IPC → Rust Command
                                                        ↓
                                               Service Layer (Rust)
                                                        ↓
                                            Windows APIs / File System
                                                        ↓
UI Update ← Store ← Hook ← Service ←── JSON Response (serde)
```

---

## Estrutura do Projeto

```
FialhoClean/
│
├── src/                          # Frontend React/TypeScript
│   ├── components/
│   │   ├── cleaner/              # Tela de limpeza (5 sub-telas)
│   │   │   ├── CleanerView.tsx
│   │   │   ├── CleaningOverlay.tsx  # Animação de limpeza
│   │   │   ├── SelectScreen.tsx
│   │   │   ├── ScanningScreen.tsx
│   │   │   ├── ResultsScreen.tsx
│   │   │   └── SuccessScreen.tsx
│   │   ├── dashboard/
│   │   ├── debloater/
│   │   ├── optimizer/
│   │   ├── settings/
│   │   ├── layout/               # TitleBar, Sidebar
│   │   └── shared/               # Button, Modal, Badge, etc.
│   │
│   ├── constants/                # Categorias, ícones, thresholds
│   ├── hooks/                    # Lógica de negócio por feature
│   ├── i18n/                     # pt-BR e en
│   ├── lib/                      # Utilitários, formato, invoke wrapper
│   ├── services/                 # Camada de chamada ao backend
│   ├── stores/                   # Estado global Zustand
│   └── types/                    # Tipos TypeScript
│
├── src-tauri/                    # Backend Rust
│   ├── src/
│   │   ├── commands/             # Endpoints expostos ao frontend
│   │   │   ├── cleaner.rs
│   │   │   ├── debloater.rs
│   │   │   ├── optimizer.rs
│   │   │   └── system.rs
│   │   ├── models/               # Structs + enums serializáveis
│   │   ├── services/             # Lógica de negócio Rust
│   │   │   ├── cleaner.rs        # 16 módulos de limpeza + validação
│   │   │   ├── debloater.rs
│   │   │   ├── optimizer.rs
│   │   │   └── system_info.rs
│   │   ├── errors.rs             # AppError centralizado
│   │   ├── lib.rs                # Registro de commands Tauri
│   │   └── main.rs
│   ├── capabilities/
│   │   └── default.json          # Permissões da janela
│   ├── icons/
│   └── tauri.conf.json
│
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## Pré-requisitos

Certifique-se de ter instalado:

```
✓ Node.js        >= 20.x       https://nodejs.org
✓ Rust + Cargo   >= 1.80       https://rustup.rs
✓ WebView2       Runtime       (pré-instalado no Windows 11 / Windows 10 atualizado)
✓ Visual Studio  Build Tools   (C++ workload — necessário para compilar o Rust no Windows)
```

Verifique as instalações:

```bash
node --version    # v20.x.x ou superior
rustc --version   # rustc 1.80.x ou superior
cargo --version   # cargo 1.80.x ou superior
```

---

## Instalação e Execução

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/FialhoClean.git
cd FialhoClean
```

### 2. Instale as dependências Node

```bash
npm install
```

### 3. Execute em modo desenvolvimento

```bash
npm run tauri dev
```

> O Vite inicia na porta **1420** e o Rust compila automaticamente. Na primeira execução, o Cargo pode levar alguns minutos para baixar e compilar as dependências.

---

## Build para Produção

```bash
npm run tauri build
```

O instalador será gerado em:

```
src-tauri/target/release/bundle/
├── msi/        → FialhoClean_1.0.0_x64_en-US.msi
└── nsis/       → FialhoClean_1.0.0_x64-setup.exe
```

### Flags de otimização ativas no release

```toml
[profile.release]
panic       = "abort"     # Remove unwinding, binário menor
codegen-units = 1         # LTO mais agressivo
lto         = true        # Link-Time Optimization
opt-level   = "s"         # Otimiza para tamanho
strip       = true        # Remove símbolos de debug
```

---

## Segurança

### Validação server-side de caminhos

O módulo de limpeza implementa uma camada de segurança crítica no Rust: **toda** path recebida do frontend é validada antes de qualquer deleção.

```rust
fn is_path_allowed(path: &str, category: &CleanCategory) -> bool {
    // 1. Rejeita null bytes
    // 2. Rejeita traversal de diretório (..)
    // 3. Valida prefixo contra diretórios esperados por categoria
    // 4. Case-insensitive (Windows)
}
```

Isso garante que mesmo uma manipulação maliciosa do frontend **não consegue deletar arquivos arbitrários** fora do escopo de cada categoria.

### CSP

A Content Security Policy da janela restringe recursos a `'self'`, bloqueando carregamento de scripts, estilos ou fontes externas:

```json
"csp": "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data: blob:"
```

### Permissões Tauri mínimas

Apenas as permissões estritamente necessárias estão declaradas em `capabilities/default.json`:

```json
"permissions": [
  "core:default",
  "core:window:allow-minimize",
  "core:window:allow-toggle-maximize",
  "core:window:allow-close",
  "core:window:allow-start-dragging"
]
```

---

## Internacionalização

O app suporta **Português (pt-BR)** e **Inglês (en)**, detectando o idioma do sistema automaticamente. O idioma pode ser alterado nas Configurações.

```
src/i18n/locales/
├── pt-BR.json    # Português Brasileiro (padrão)
└── en.json       # English
```

Todas as strings da interface, incluindo labels e descrições das 16 categorias de limpeza, estão totalmente traduzidas em ambos os idiomas.

---

<div align="center">

Feito com Rust, React e ☕

</div>
