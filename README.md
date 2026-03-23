<div align="center">

<img width="80" src="src-tauri/icons/128x128.png" alt="FialhoClean logo" />

<h1>FialhoClean</h1>

<p>Limpeza, otimização e controle total do seu Windows — em um só lugar.</p>

<p>
  <a href="https://github.com/HanielCota/FialhoClean/releases/latest">
    <img src="https://img.shields.io/github/v/release/HanielCota/FialhoClean?style=flat-square&color=ffffff&labelColor=111111&label=release" alt="Latest Release" />
  </a>
  <img src="https://img.shields.io/badge/Windows-10%2F11-0078D4?style=flat-square&logo=windows&logoColor=white" alt="Windows" />
  <img src="https://img.shields.io/badge/Tauri-2.x-24C8D8?style=flat-square&logo=tauri&logoColor=white" alt="Tauri" />
  <img src="https://img.shields.io/badge/Rust-CE422B?style=flat-square&logo=rust&logoColor=white" alt="Rust" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-white?style=flat-square" alt="License" />
  </a>
</p>

<p>
  <a href="#-instalação">Instalação</a> ·
  <a href="#-funcionalidades">Funcionalidades</a> ·
  <a href="#-desenvolvimento">Desenvolvimento</a> ·
  <a href="https://github.com/HanielCota/FialhoClean/issues">Reportar Bug</a>
</p>

</div>

---

## Sobre o projeto

**FialhoClean** é um aplicativo desktop nativo para Windows construído com **Tauri 2 + React 19 + Rust**. Combina um frontend moderno com um backend de alta performance para entregar limpeza real do sistema, otimização de desempenho e remoção de bloatware — tudo numa interface dark mode minimalista.

> Zero Electron. Zero overhead. Binário final abaixo de **10 MB**, sem runtime Node.js ou WebView pesado.

---

## ✨ Funcionalidades

<table>
<tr>
<td width="50%">

### 🧹 Limpeza
Escaneia **16 categorias** em paralelo via Tokio. Temp, cache de navegadores, lixeira, logs, prefetch, Windows Update, Discord, Spotify, Steam, DNS e muito mais.

</td>
<td width="50%">

### ⚡ Otimizador
Controle de plano de energia, efeitos visuais, programas de inicialização e serviços do Windows com indicadores de segurança (Safe / Caution / Dangerous).

</td>
</tr>
<tr>
<td width="50%">

### 🛡️ Debloater
Remove aplicativos pré-instalados (UWP/MSIX) via PowerShell. Remoção em lote com badges de aviso em apps críticos do sistema.

</td>
<td width="50%">

### 📊 Dashboard
Visão em tempo real de CPU, RAM, disco e uptime. Indicador de saúde do PC e acesso rápido à limpeza com um clique.

</td>
</tr>
</table>

---

## 🚀 Instalação

Baixe o instalador mais recente na página de [Releases](https://github.com/HanielCota/FialhoClean/releases/latest):

| Formato | Arquivo |
|---------|---------|
| **NSIS** (recomendado) | `FialhoClean_x.x.x_x64-setup.exe` |
| **MSI** | `FialhoClean_x.x.x_x64_en-US.msi` |

> Requer **Windows 10 22H2** ou superior e **WebView2 Runtime** (pré-instalado no Windows 11).

---

## 🛠 Stack

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | React 19, TypeScript 5.9, Tailwind CSS 4, Zustand 5, Vite 8 |
| **Backend** | Rust, Tauri 2, Tokio, Sysinfo, Winreg |
| **i18n** | i18next — Português (pt-BR) e English (en) |
| **Tooling** | Biome, Cargo, GitHub Actions |

---

## 💻 Desenvolvimento

### Pré-requisitos

```
Node.js  >= 20     https://nodejs.org
Rust     >= 1.80   https://rustup.rs
WebView2 Runtime   (pré-instalado no Windows 11)
```

### Executar localmente

```bash
# Clone o repositório
git clone https://github.com/HanielCota/FialhoClean.git
cd FialhoClean

# Instale as dependências
npm install

# Inicie em modo desenvolvimento
npm run tauri dev
```

> Na primeira execução, o Cargo pode levar alguns minutos compilando as dependências Rust.

### Build para produção

```bash
npm run tauri build
```

O instalador será gerado em `src-tauri/target/release/bundle/`.

### Checks antes do PR

```bash
npm run check:all   # Biome lint + cargo fmt check
```

---

## 🔒 Segurança

Toda path recebida do frontend é validada no Rust antes de qualquer deleção — rejeita null bytes, traversal (`..`) e caminhos fora do escopo esperado por categoria. A janela aplica CSP estrita (`self` apenas) e permissões Tauri mínimas.

Vulnerabilidades devem ser reportadas conforme a [política de segurança](SECURITY.md).

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja o [CONTRIBUTING.md](CONTRIBUTING.md) para o fluxo de trabalho e convenções de commit.

---

<div align="center">

Feito com Rust, React e ☕ por [Haniel Cota](https://github.com/HanielCota)

</div>
