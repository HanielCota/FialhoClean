# FialhoClean

**FialhoClean** é um aplicativo desktop gratuito e open-source para manutenção e otimização do Windows. Desenvolvido com Tauri 2, React e Rust, ele oferece limpeza de disco, remoção de bloatware, ajustes de desempenho e ferramentas de reparo — tudo numa interface leve, moderna e sem anúncios.

---

## O que ele faz

O FialhoClean reúne em um único lugar as tarefas que todo usuário Windows acaba precisando fazer, mas que normalmente exigem navegar por dezenas de menus diferentes do sistema.

### Limpeza inteligente de disco

O módulo de limpeza escaneia 16 categorias de arquivos temporários e desnecessários:

- **Arquivos temporários** do sistema e aplicativos
- **Cache de navegadores** (Chrome, Edge, Firefox) — senhas e favoritos ficam intactos
- **Lixeira** do Windows
- **Logs antigos** de debug e diagnóstico
- **Cache de atualizações** do Windows Update (frequentemente gigabytes esquecidos)
- **Delivery Optimization** — cache de distribuição de atualizações em rede
- **Relatórios de erros** enviados à Microsoft
- **Cache de miniaturas e ícones** do Explorer
- **Dumps de memória** de crashes do sistema
- **Cache do Discord, Spotify e Steam**
- **Lista de arquivos recentes** (relevante para privacidade)
- **Cache DNS** e **Prefetch** do Windows

O processo segue um fluxo seguro: selecionar categorias, escanear, revisar os resultados com detalhamento por arquivo, e só então confirmar a limpeza. Nada é deletado sem consentimento.

### Remoção de bloatware

O Windows vem com dezenas de aplicativos pré-instalados que a maioria das pessoas nunca usa — Cortana, Xbox Game Bar, Get Help, Mail, Clipchamp, entre outros. O FialhoClean mantém um banco de dados com mais de 100 apps conhecidos, classificados por nível de segurança:

- **Seguro** — pode remover sem preocupação
- **Cautela** — funcional, mas a remoção pode afetar alguma integração do sistema

Apps críticos do Windows (Menu Iniciar, Shell, .NET Framework, etc.) são automaticamente protegidos e nunca aparecem na lista de remoção.

### Otimizador de desempenho

Quatro áreas de ajuste fino, acessíveis por abas:

**Desempenho** — Desativar efeitos visuais para ganho de fluidez, ativar o Game Mode, desbloquear o plano de energia Ultimate Performance (oculto por padrão no Windows), e desativar o throttling de rede.

**Inicialização** — Gerenciar programas que abrem junto com o Windows, com indicação de impacto estimado no tempo de boot (lento, médio, rápido). Controle de hibernação e inicialização rápida.

**Privacidade** — Desativar telemetria do Windows, Bing na busca do Menu Iniciar, ID de publicidade, histórico de atividades e acesso a localização.

**Serviços** — Gerenciar serviços de fundo do Windows com controles de iniciar, parar, ativar e desativar. 17 serviços seguros para desativar (Superfetch, DiagTrack, Windows Search, Fax, serviços do Xbox, etc.) e 5 serviços com cautela (Spooler de impressão, Windows Update, BITS). Também permite gerenciar tarefas agendadas de telemetria.

Extras incluem otimizador de RAM (libera memória de processos ociosos) e toggle de GPU Hardware Scheduling (HAGS).

### Ferramentas de reparo

Três utilitários para quando algo não vai bem:

- **Ponto de restauração** — Cria um snapshot do sistema para reverter mudanças se necessário
- **SFC (System File Checker)** — Escaneia e repara arquivos protegidos do Windows
- **DISM** — Repara o repositório de componentes do Windows (resolver quando o SFC falha repetidamente)

### Dashboard

Painel com visão geral da saúde do sistema em tempo real: armazenamento, uso de RAM, CPU e uptime. Indicador de saúde geral (bom, pode melhorar, precisa de atenção) e histórico de limpezas anteriores.

---

## Por que usar

- **Leve** — O instalador tem menos de 10 MB. O app consome mínimo de RAM porque o frontend roda em WebView nativo e o backend é Rust compilado.
- **Seguro** — Todas as operações destrutivas pedem confirmação. Paths de arquivo são validados contra whitelist. Serviços e apps críticos são protegidos por banco de dados curado. Nenhum dado sai do seu computador.
- **Rápido** — Scans de limpeza levam segundos. Operações de arquivo rodam em paralelo com controle de concorrência.
- **Sem lixo** — Sem anúncios, sem telemetria, sem conta obrigatória, sem trial. Open-source sob licença aberta.
- **Bilíngue** — Interface completa em Português (BR) e Inglês.

---

## Tecnologia

| Componente | Stack |
|------------|-------|
| Interface | React 19 + TypeScript + Tailwind CSS 4 |
| Backend | Rust (Tauri 2) |
| Estado | Zustand + TanStack React Query |
| Internacionalização | i18next |
| Empacotamento | Tauri bundler (NSIS installer para Windows) |

O backend Rust executa todas as operações de sistema (PowerShell, registro, filesystem, serviços) com timeouts, whitelists e validação de entrada. O frontend é uma SPA React que se comunica com o backend via IPC do Tauri.

---

## Requisitos

- Windows 10 ou 11
- Algumas funcionalidades (reparo, serviços, debloater) requerem execução como administrador
