<div align="center">

<br>

<img width="100" src="src-tauri/icons/128x128.png" alt="FialhoClean" />

<br>

# FialhoClean

### 🧹 Limpeza · ⚡ Otimização · 🛡️ Controle Total

**O canivete suíço da manutenção Windows — nativo, leve e sem compromissos.**

<br>

[![Release](https://img.shields.io/github/v/release/HanielCota/FialhoClean?style=for-the-badge&logo=github&color=0d1117&labelColor=0d1117)](https://github.com/HanielCota/FialhoClean/releases/latest)
&nbsp;
![Windows](https://img.shields.io/badge/Windows_10%2F11-0078D4?style=for-the-badge&logo=windows11&logoColor=white)
&nbsp;
![Tauri](https://img.shields.io/badge/Tauri_2-FFC131?style=for-the-badge&logo=tauri&logoColor=000)
&nbsp;
![Rust](https://img.shields.io/badge/Rust-CE422B?style=for-the-badge&logo=rust&logoColor=white)
&nbsp;
![React](https://img.shields.io/badge/React_19-58C4DC?style=for-the-badge&logo=react&logoColor=000)
&nbsp;
[![License](https://img.shields.io/badge/MIT-white?style=for-the-badge&label=license&labelColor=0d1117&color=22c55e)](LICENSE)

<br>

[📦 Download](#-instalação) · [✨ Features](#-funcionalidades) · [🛠 Dev Setup](#-desenvolvimento) · [🐛 Reportar Bug](https://github.com/HanielCota/FialhoClean/issues) · [💡 Sugerir Feature](https://github.com/HanielCota/FialhoClean/issues/new?template=feature_request.md)

<br>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" alt="line" width="100%">

</div>

<br>

## 🎯 O que é o FialhoClean?

> **FialhoClean** é um aplicativo desktop nativo para Windows que combina **Tauri 2 + React 19 + Rust** para entregar limpeza real, otimização de performance e remoção de bloatware — tudo em uma interface dark mode minimalista e elegante.

```
🚀 Zero Electron. Zero overhead.
📦 Binário final < 10 MB
🔥 Sem runtime Node.js ou WebView pesado
⚡ Backend Rust com concorrência via Tokio
```

<br>

## ✨ Funcionalidades

<table>
<tr>
<td width="50%" valign="top">

### 🧹 Limpeza Profunda

Escaneia **16 categorias** em paralelo via Tokio:

- `Temp` · `Prefetch` · `Logs` do Windows
- Cache de **Chrome, Edge, Firefox, Opera, Brave**
- `Lixeira` · `Windows Update` · `DNS Cache`
- `Discord` · `Spotify` · `Steam`
- Thumbnails · Crash Dumps · Installers antigos

> Tudo escaneado simultaneamente. Resultado em segundos.

</td>
<td width="50%" valign="top">

### ⚡ Otimizador de Performance

Controle granular do seu sistema:

- **Planos de Energia** — Alternar entre Balanced, High Performance e Ultimate
- **Efeitos Visuais** — Desabilitar animações e transparências
- **Startup Manager** — Gerenciar programas de inicialização
- **Serviços do Windows** — Indicadores de segurança: `Safe` `Caution` `Dangerous`

> Cada ação mostra o impacto real na performance.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🛡️ Debloater

Remoção inteligente de apps pré-instalados:

- Remove apps **UWP/MSIX** via PowerShell
- Remoção em **lote** com seleção múltipla
- Badges de aviso em apps **críticos do sistema**
- Lista atualizada de bloatware comum

> Limpe o Windows de fábrica sem medo.

</td>
<td width="50%" valign="top">

### 📊 Dashboard em Tempo Real

Visão completa da saúde do seu PC:

- **CPU** — Uso em tempo real por core
- **RAM** — Consumo atual e disponível
- **Disco** — Espaço livre e velocidade
- **Uptime** — Tempo desde o último boot
- **Health Score** — Indicador geral de saúde

> Um clique para escanear e limpar.

</td>
</tr>
</table>

<br>

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    FialhoClean                          │
├──────────────────────┬──────────────────────────────────┤
│      Frontend        │           Backend                │
│                      │                                  │
│  React 19            │  Rust + Tauri 2                  │
│  TypeScript 5.9      │  Tokio (async runtime)           │
│  Tailwind CSS 4      │  Sysinfo (métricas do sistema)   │
│  Zustand 5 (state)   │  Winreg (registro do Windows)    │
│  Vite 8 (bundler)    │  PowerShell (debloater)          │
│                      │                                  │
├──────────────────────┴──────────────────────────────────┤
│  i18n: i18next — pt-BR 🇧🇷  ·  en 🇺🇸                    │
├─────────────────────────────────────────────────────────┤
│  Tooling: Biome · Cargo · GitHub Actions CI/CD          │
└─────────────────────────────────────────────────────────┘
```

<br>

## 📦 Instalação

<div align="center">

### ⬇️ [Baixar Última Versão](https://github.com/HanielCota/FialhoClean/releases/latest)

</div>

| Formato | Arquivo | Descrição |
|:-------:|:--------|:----------|
| **NSIS** | `FialhoClean_x.x.x_x64-setup.exe` | ✅ Recomendado — Instalador padrão Windows |
| **MSI** | `FialhoClean_x.x.x_x64_en-US.msi` | Instalador alternativo via Windows Installer |

<br>

> [!IMPORTANT]
> **Requisitos mínimos:**
> - Windows 10 22H2 ou superior
> - WebView2 Runtime (pré-instalado no Windows 11)

<br>

## 💻 Desenvolvimento

### Pré-requisitos

| Ferramenta | Versão | Link |
|:----------:|:------:|:----:|
| **Node.js** | `>= 20` | [nodejs.org](https://nodejs.org) |
| **Rust** | `>= 1.80` | [rustup.rs](https://rustup.rs) |
| **WebView2** | Latest | Pré-instalado no Win 11 |

### Quick Start

```bash
# 1. Clone o repositório
git clone https://github.com/HanielCota/FialhoClean.git
cd FialhoClean

# 2. Instale as dependências
npm install

# 3. Inicie em modo dev
npm run tauri dev
```

> [!NOTE]
> Na primeira execução, o Cargo pode levar alguns minutos compilando as dependências Rust. Grabe um café ☕

### Build de Produção

```bash
npm run tauri build
```

O instalador será gerado em:
```
src-tauri/target/release/bundle/
├── nsis/
│   └── FialhoClean_x.x.x_x64-setup.exe
└── msi/
    └── FialhoClean_x.x.x_x64_en-US.msi
```

### Checks & Linting

```bash
# Rodar todos os checks de uma vez
npm run check:all

# Individualmente
npx biome check .        # Lint + format do frontend
cargo fmt --check        # Format check do Rust
cargo clippy             # Lint do Rust
```

<br>

## 📁 Estrutura do Projeto

```
FialhoClean/
├── src/                    # Frontend React
│   ├── components/         # Componentes reutilizáveis
│   ├── pages/              # Páginas da aplicação
│   ├── stores/             # Zustand stores
│   ├── hooks/              # Custom hooks
│   ├── i18n/               # Traduções (pt-BR, en)
│   └── styles/             # Tailwind config & global CSS
│
├── src-tauri/              # Backend Rust
│   ├── src/
│   │   ├── main.rs         # Entry point
│   │   ├── commands/       # Tauri commands (IPC)
│   │   ├── cleaner/        # Lógica de limpeza
│   │   ├── optimizer/      # Otimizações do sistema
│   │   └── debloater/      # Remoção de bloatware
│   ├── icons/              # Ícones do app
│   ├── Cargo.toml          # Dependências Rust
│   └── tauri.conf.json     # Config do Tauri
│
├── package.json
├── vite.config.ts
└── tailwind.config.ts
```

<br>

## 🔒 Segurança

A segurança é levada a sério em cada camada:

| Camada | Proteção |
|:------:|:---------|
| **Paths** | Toda path do frontend é validada no Rust — rejeita null bytes, traversal (`..`) e caminhos fora do escopo |
| **CSP** | Content Security Policy estrita (`self` apenas) |
| **Permissões** | Permissões Tauri configuradas com princípio de menor privilégio |
| **IPC** | Comandos Tauri tipados e validados antes de execução |

> [!CAUTION]
> Encontrou uma vulnerabilidade? **Não abra uma issue pública.** Siga a [política de segurança](SECURITY.md) para reporte responsável.

<br>

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Antes de começar:

1. Leia o [**CONTRIBUTING.md**](CONTRIBUTING.md) para entender o fluxo
2. Confira as [**issues abertas**](https://github.com/HanielCota/FialhoClean/issues) ou crie uma nova
3. Faça um fork, crie sua branch e abra um PR

```bash
# Convenção de commits
feat: nova funcionalidade
fix: correção de bug
docs: atualização de documentação
refactor: refatoração sem mudança de comportamento
chore: manutenção geral
```

<br>

## ⭐ Star History

Se o FialhoClean te ajudou, considere dar uma ⭐ no repositório!

[![Star History Chart](https://api.star-history.com/svg?repos=HanielCota/FialhoClean&type=Date)](https://star-history.com/#HanielCota/FialhoClean&Date)

<br>

## 📄 Licença

Distribuído sob a licença **MIT**. Veja [`LICENSE`](LICENSE) para mais informações.

<br>

---

<div align="center">

**Feito com 🦀 Rust, ⚛️ React e ☕ por [Haniel Cota](https://github.com/HanielCota)**

<br>

<a href="https://github.com/HanielCota/FialhoClean/releases/latest">
  <img src="https://img.shields.io/badge/⬇️_Download_FialhoClean-0d1117?style=for-the-badge&logoColor=white" alt="Download" />
</a>

</div>
