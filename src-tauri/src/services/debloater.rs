use crate::errors::AppError;
use crate::models::debloater::{AppInfo, BloatCategory, BloatwareEntry, RemoveResult, SafetyLevel};
use std::collections::HashSet;
use std::time::Duration;
use tokio::time::timeout;

/// Maximum time to wait for Get-AppxPackage (can be slow on first call).
const QUERY_TIMEOUT: Duration = Duration::from_secs(60);
/// Maximum time to wait for Remove-AppxPackage per package.
const REMOVAL_TIMEOUT: Duration = Duration::from_secs(60);

pub fn get_bloatware_database() -> Vec<BloatwareEntry> {
    vec![
        // ════════════════════════════════════════════════════════════════════
        // MICROSOFT APPS
        // ════════════════════════════════════════════════════════════════════

        BloatwareEntry {
            family_name_prefix: "Microsoft.549981C3F5F10".into(),
            friendly_name: "Cortana".into(),
            safety_level: SafetyLevel::Caution,
            description: "Microsoft's voice assistant. Removing disables voice search and the taskbar Cortana button, but doesn't affect Start Menu search.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "MicrosoftWindows.Client.WebExperience".into(),
            friendly_name: "Windows Web Experience (Copilot)".into(),
            safety_level: SafetyLevel::Caution,
            description: "Hosts the Copilot AI widget and Widgets board on the taskbar. Removing it hides both panels — the rest of Windows is unaffected.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.Windows.Ai.Copilot.Provider".into(),
            friendly_name: "Copilot AI Provider".into(),
            safety_level: SafetyLevel::Caution,
            description: "Backend provider for Microsoft's Copilot AI features in Windows 11. Safe to remove if you don't use Copilot.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.Copilot".into(),
            friendly_name: "Microsoft Copilot".into(),
            safety_level: SafetyLevel::Safe,
            description: "Standalone Copilot AI app. The OS-integrated Copilot experience is separate — removing this app only removes the standalone window.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.WindowsFeedbackHub".into(),
            friendly_name: "Feedback Hub".into(),
            safety_level: SafetyLevel::Safe,
            description: "Sends bug reports and feature suggestions to Microsoft. Safe to remove on personal PCs.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.GetHelp".into(),
            friendly_name: "Get Help".into(),
            safety_level: SafetyLevel::Caution,
            description: "Links to Microsoft's online support system. Caution: some Windows troubleshooters launch this app automatically.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.Getstarted".into(),
            friendly_name: "Tips / Get Started".into(),
            safety_level: SafetyLevel::Safe,
            description: "Windows onboarding walkthrough. Only shown to new users — safe to remove.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.WindowsMaps".into(),
            friendly_name: "Windows Maps".into(),
            safety_level: SafetyLevel::Safe,
            description: "Offline map viewer powered by Bing. Easily replaced by any browser-based map service.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.WindowsSoundRecorder".into(),
            friendly_name: "Sound Recorder".into(),
            safety_level: SafetyLevel::Safe,
            description: "Basic audio recording app. Safe to remove if you use dedicated recording software.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.WindowsAlarms".into(),
            friendly_name: "Alarms & Clock".into(),
            safety_level: SafetyLevel::Safe,
            description: "Simple alarm and timer app. Phone or browser alternatives work just as well.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.MicrosoftStickyNotes".into(),
            friendly_name: "Sticky Notes".into(),
            safety_level: SafetyLevel::Safe,
            description: "Desktop sticky notes synced to Microsoft account. Safe to remove if unused.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.Paint3D".into(),
            friendly_name: "Paint 3D".into(),
            safety_level: SafetyLevel::Safe,
            description: "3D modeling companion app. Replaced by the updated Paint app on Windows 11.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.3DBuilder".into(),
            friendly_name: "3D Builder".into(),
            safety_level: SafetyLevel::Safe,
            description: "3D printing design app rarely used by most people. Safe to remove.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.MixedReality.Portal".into(),
            friendly_name: "Mixed Reality Portal".into(),
            safety_level: SafetyLevel::Safe,
            description: "Windows Mixed Reality headset app. Useless without compatible VR hardware.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.Whiteboard".into(),
            friendly_name: "Microsoft Whiteboard".into(),
            safety_level: SafetyLevel::Safe,
            description: "Collaborative digital whiteboard for Teams meetings and touch screens.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.Wallet".into(),
            friendly_name: "Pay / Wallet".into(),
            safety_level: SafetyLevel::Safe,
            description: "Microsoft Pay app for contactless payments. Rarely useful on desktop PCs.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.Advertising".into(),
            friendly_name: "Microsoft Advertising SDK".into(),
            safety_level: SafetyLevel::Safe,
            description: "Ad-serving framework bundled with free UWP apps. Removing may affect some free-app ad display, not the apps themselves.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.Windows.DevHome".into(),
            friendly_name: "Dev Home".into(),
            safety_level: SafetyLevel::Safe,
            description: "Developer dashboard for managing dev environments and GitHub integrations. Only relevant for software developers.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "MicrosoftCorporationII.QuickAssist".into(),
            friendly_name: "Quick Assist".into(),
            safety_level: SafetyLevel::Caution,
            description: "Allows Microsoft support or trusted contacts to remotely control your screen. Remove if you never use remote assistance.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "MicrosoftCorporationII.MicrosoftFamily".into(),
            friendly_name: "Family Safety".into(),
            safety_level: SafetyLevel::Caution,
            description: "Parental controls and screen time management for child accounts. Remove only if your household doesn't use Microsoft Family features.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.MicrosoftOfficeHub".into(),
            friendly_name: "Office Hub".into(),
            safety_level: SafetyLevel::Safe,
            description: "Advertisement app that promotes Microsoft 365 subscriptions. Has no productive functionality of its own.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.Todos".into(),
            friendly_name: "Microsoft To Do".into(),
            safety_level: SafetyLevel::Safe,
            description: "Task management app synced with Microsoft account. Safe to remove if you use Notion, Todoist, or another task manager.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.PowerAutomateDesktop".into(),
            friendly_name: "Power Automate Desktop".into(),
            safety_level: SafetyLevel::Safe,
            description: "Robotic process automation tool for scripting repetitive tasks. Only useful for power users with specific automation needs.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.OutlookForWindows".into(),
            friendly_name: "New Outlook (Preview)".into(),
            safety_level: SafetyLevel::Caution,
            description: "Microsoft's new web-based Outlook redesign. Caution: may be registered as the default email client on some systems.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.People".into(),
            friendly_name: "People".into(),
            safety_level: SafetyLevel::Safe,
            description: "Contact manager that syncs with Microsoft, Google, and social accounts. Rarely used as a standalone app.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.BingWeather".into(),
            friendly_name: "Weather (Bing)".into(),
            safety_level: SafetyLevel::Safe,
            description: "Bing-powered weather app with ads. Any browser bookmark or widget replaces it.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.BingNews".into(),
            friendly_name: "News (Bing)".into(),
            safety_level: SafetyLevel::Safe,
            description: "Bing news aggregator with ads and sponsored articles.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.BingFinance".into(),
            friendly_name: "Finance (Bing)".into(),
            safety_level: SafetyLevel::Safe,
            description: "Bing-powered stocks and financial news app. Not installed on all Windows editions.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.BingSports".into(),
            friendly_name: "Sports (Bing)".into(),
            safety_level: SafetyLevel::Safe,
            description: "Bing sports scores and news. Not present on all Windows editions.".into(),
            category: BloatCategory::Microsoft,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.BingSearch".into(),
            friendly_name: "Bing Search Widget".into(),
            safety_level: SafetyLevel::Safe,
            description: "Bing search integration widget for the taskbar. Removing it does not affect the Start Menu search or Windows Search.".into(),
            category: BloatCategory::Microsoft,
        },

        // ════════════════════════════════════════════════════════════════════
        // COMMUNICATION
        // ════════════════════════════════════════════════════════════════════

        BloatwareEntry {
            family_name_prefix: "Microsoft.windowscommunicationsapps".into(),
            friendly_name: "Mail & Calendar".into(),
            safety_level: SafetyLevel::Caution,
            description: "Built-in email and calendar client. Remove only if you have Outlook desktop or another mail app set as default.".into(),
            category: BloatCategory::Communication,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.SkypeApp".into(),
            friendly_name: "Skype (UWP)".into(),
            safety_level: SafetyLevel::Safe,
            description: "Pre-installed UWP version of Skype. Uninstalling doesn't affect the standalone desktop Skype if installed separately.".into(),
            category: BloatCategory::Communication,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.YourPhone".into(),
            friendly_name: "Phone Link".into(),
            safety_level: SafetyLevel::Safe,
            description: "Links your Android phone to Windows for notifications, calls, and file transfer. Safe to remove if unused.".into(),
            category: BloatCategory::Communication,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.MicrosoftTeams".into(),
            friendly_name: "Microsoft Teams (Chat)".into(),
            safety_level: SafetyLevel::Caution,
            description: "Lightweight Teams Chat integrated into the Windows 11 taskbar. Different from the full Teams desktop app — safe to remove if you use the full version.".into(),
            category: BloatCategory::Communication,
        },
        BloatwareEntry {
            family_name_prefix: "LinkedIn.LinkedInforWindows".into(),
            friendly_name: "LinkedIn".into(),
            safety_level: SafetyLevel::Safe,
            description: "Microsoft Store version of LinkedIn. The browser version works equally well.".into(),
            category: BloatCategory::Communication,
        },
        BloatwareEntry {
            family_name_prefix: "Twitter.Twitter".into(),
            friendly_name: "X / Twitter".into(),
            safety_level: SafetyLevel::Safe,
            description: "Microsoft Store version of X (Twitter). Pre-installed on some OEM builds.".into(),
            category: BloatCategory::Communication,
        },

        // ════════════════════════════════════════════════════════════════════
        // ENTERTAINMENT
        // ════════════════════════════════════════════════════════════════════

        BloatwareEntry {
            family_name_prefix: "Microsoft.GamingApp".into(),
            friendly_name: "Xbox (Gaming App)".into(),
            safety_level: SafetyLevel::Caution,
            description: "New Xbox app for Windows 11 — used for Xbox Game Pass, game library, and social features. Remove only if you don't use Game Pass.".into(),
            category: BloatCategory::Entertainment,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.ZuneMusic".into(),
            friendly_name: "Groove Music".into(),
            safety_level: SafetyLevel::Safe,
            description: "Microsoft's local music player. The streaming service was shut down in 2017 — no online features remain.".into(),
            category: BloatCategory::Entertainment,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.ZuneVideo".into(),
            friendly_name: "Movies & TV".into(),
            safety_level: SafetyLevel::Safe,
            description: "Video player tied to the Microsoft Store movie rental and purchase service.".into(),
            category: BloatCategory::Entertainment,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.Xbox".into(),
            friendly_name: "Xbox Apps (bundle)".into(),
            safety_level: SafetyLevel::Caution,
            description: "Xbox Game Bar overlay and companion services. Removing may affect in-game performance monitoring on some titles.".into(),
            category: BloatCategory::Entertainment,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.XboxApp".into(),
            friendly_name: "Xbox Console Companion".into(),
            safety_level: SafetyLevel::Safe,
            description: "Legacy Xbox companion app, superseded by the new Xbox Gaming App. Safe to remove.".into(),
            category: BloatCategory::Entertainment,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.XboxGamingOverlay".into(),
            friendly_name: "Xbox Game Bar".into(),
            safety_level: SafetyLevel::Caution,
            description: "In-game overlay for screenshots, clips, and performance stats (Win+G). Remove if you use MSI Afterburner, RivaTuner, or another overlay instead.".into(),
            category: BloatCategory::Entertainment,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.MicrosoftSolitaireCollection".into(),
            friendly_name: "Solitaire Collection".into(),
            safety_level: SafetyLevel::Safe,
            description: "Classic card games bundle with in-app ads and a paid Solitaire Premium subscription upsell.".into(),
            category: BloatCategory::Entertainment,
        },
        BloatwareEntry {
            family_name_prefix: "Clipchamp.Clipchamp".into(),
            friendly_name: "Clipchamp".into(),
            safety_level: SafetyLevel::Safe,
            description: "Browser-based video editor bundled with Windows 11. Safe to remove if you use DaVinci Resolve, Premiere, or another editor.".into(),
            category: BloatCategory::Entertainment,
        },
        BloatwareEntry {
            family_name_prefix: "SpotifyAB.SpotifyMusic".into(),
            friendly_name: "Spotify (Store)".into(),
            safety_level: SafetyLevel::Safe,
            description: "Microsoft Store version of Spotify. Remove and install the standalone desktop app for better performance and no UWP limitations.".into(),
            category: BloatCategory::Entertainment,
        },
        BloatwareEntry {
            family_name_prefix: "king.com".into(),
            friendly_name: "King Games (Candy Crush etc.)".into(),
            safety_level: SafetyLevel::Safe,
            description: "Mobile game ports pre-installed via Microsoft's OEM promotional agreements. All are ad-supported with in-app purchases.".into(),
            category: BloatCategory::Entertainment,
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.Office.OneNote".into(),
            friendly_name: "OneNote for Windows 10".into(),
            safety_level: SafetyLevel::Safe,
            description: "Legacy UWP version of OneNote. The full OneNote desktop app bundled with Microsoft 365 is more capable.".into(),
            category: BloatCategory::Entertainment,
        },
        BloatwareEntry {
            family_name_prefix: "PandoraMediaInc.".into(),
            friendly_name: "Pandora".into(),
            safety_level: SafetyLevel::Safe,
            description: "Pandora internet radio app. Pre-installed on some OEM builds in the US market.".into(),
            category: BloatCategory::Entertainment,
        },
        BloatwareEntry {
            family_name_prefix: "TuneIn.TuneInRadio".into(),
            friendly_name: "TuneIn Radio".into(),
            safety_level: SafetyLevel::Safe,
            description: "Internet radio streaming app. Pre-installed on some builds — safely removable.".into(),
            category: BloatCategory::Entertainment,
        },

        // ════════════════════════════════════════════════════════════════════
        // THIRD-PARTY
        // ════════════════════════════════════════════════════════════════════

        BloatwareEntry {
            family_name_prefix: "Disney.37853D22215B2".into(),
            friendly_name: "Disney+".into(),
            safety_level: SafetyLevel::Safe,
            description: "Disney+ streaming app pre-installed on some OEM builds. Safe to remove if you don't have a subscription.".into(),
            category: BloatCategory::ThirdParty,
        },
        BloatwareEntry {
            family_name_prefix: "AmazonVideo.PrimeVideo".into(),
            friendly_name: "Prime Video".into(),
            safety_level: SafetyLevel::Safe,
            description: "Amazon Prime Video streaming app. Remove and use the browser version if preferred.".into(),
            category: BloatCategory::ThirdParty,
        },
        BloatwareEntry {
            family_name_prefix: "Amazon.AmazonVideo".into(),
            friendly_name: "Prime Video (Amazon)".into(),
            safety_level: SafetyLevel::Safe,
            description: "Amazon Prime Video app pre-installed via OEM agreement. Safe to remove.".into(),
            category: BloatCategory::ThirdParty,
        },
        BloatwareEntry {
            family_name_prefix: "Hulu.HuluApp".into(),
            friendly_name: "Hulu".into(),
            safety_level: SafetyLevel::Safe,
            description: "Hulu streaming app pre-installed on some OEM PCs in the US market.".into(),
            category: BloatCategory::ThirdParty,
        },
        BloatwareEntry {
            family_name_prefix: "Facebook.InstagramApp".into(),
            friendly_name: "Instagram".into(),
            safety_level: SafetyLevel::Safe,
            description: "Microsoft Store version of Instagram. Browser or desktop alternatives work fine.".into(),
            category: BloatCategory::ThirdParty,
        },
        BloatwareEntry {
            family_name_prefix: "Facebook.Facebook".into(),
            friendly_name: "Facebook".into(),
            safety_level: SafetyLevel::Safe,
            description: "Microsoft Store version of Facebook. Browser version is more feature-complete.".into(),
            category: BloatCategory::ThirdParty,
        },
        BloatwareEntry {
            family_name_prefix: "TikTokPte.Ltd.TikTok".into(),
            friendly_name: "TikTok".into(),
            safety_level: SafetyLevel::Safe,
            description: "TikTok app. Pre-installed on some OEM builds — safe to remove.".into(),
            category: BloatCategory::ThirdParty,
        },
        BloatwareEntry {
            family_name_prefix: "DolbyLaboratories.DolbyAccess".into(),
            friendly_name: "Dolby Access".into(),
            safety_level: SafetyLevel::Caution,
            description: "Dolby Atmos configuration and equalizer app. Remove only if you don't use Dolby-licensed headphones or a compatible audio device.".into(),
            category: BloatCategory::ThirdParty,
        },
        BloatwareEntry {
            family_name_prefix: "WinZipComputing.WinZipUniversal".into(),
            friendly_name: "WinZip".into(),
            safety_level: SafetyLevel::Safe,
            description: "Trial version of WinZip archive manager. Windows can open ZIP files natively — no third-party app needed.".into(),
            category: BloatCategory::ThirdParty,
        },
        BloatwareEntry {
            family_name_prefix: "CyberLinkCorp.YouCamForReal".into(),
            friendly_name: "YouCam Makeup / Effects".into(),
            safety_level: SafetyLevel::Safe,
            description: "CyberLink camera effects and beauty filters app pre-installed on some OEM laptops.".into(),
            category: BloatCategory::ThirdParty,
        },
        BloatwareEntry {
            family_name_prefix: "ExpressVPN.ExpressVPNWindows".into(),
            friendly_name: "ExpressVPN".into(),
            safety_level: SafetyLevel::Safe,
            description: "ExpressVPN client bundled on some PCs as a trial. Safe to remove if you don't use or want this VPN.".into(),
            category: BloatCategory::ThirdParty,
        },
        BloatwareEntry {
            family_name_prefix: "CyberGhost.".into(),
            friendly_name: "CyberGhost VPN".into(),
            safety_level: SafetyLevel::Safe,
            description: "CyberGhost VPN trial pre-installed on some OEM PCs. Safe to remove if not subscribed.".into(),
            category: BloatCategory::ThirdParty,
        },
        BloatwareEntry {
            family_name_prefix: "Netflix.Netflix".into(),
            friendly_name: "Netflix".into(),
            safety_level: SafetyLevel::Safe,
            description: "Netflix app pre-installed on some OEM builds. Safe to remove and use the browser version instead.".into(),
            category: BloatCategory::ThirdParty,
        },

        // ════════════════════════════════════════════════════════════════════
        // SECURITY TRIALS
        // Antivirus and security software bundled by OEMs as time-limited trials.
        // Windows Defender (built into Windows) provides free, capable protection.
        // ════════════════════════════════════════════════════════════════════

        BloatwareEntry {
            family_name_prefix: "McAfeeInc.McAfeeSecurity".into(),
            friendly_name: "McAfee Security (trial)".into(),
            safety_level: SafetyLevel::Caution,
            description: "McAfee antivirus trial bundled by OEMs. After the trial expires it becomes nagware. Windows Defender provides free, built-in protection.".into(),
            category: BloatCategory::SecurityTrials,
        },
        BloatwareEntry {
            family_name_prefix: "McAfee.McAfeeSecurity".into(),
            friendly_name: "McAfee Security".into(),
            safety_level: SafetyLevel::Caution,
            description: "McAfee antivirus bundled on many new PCs. After removing, Windows Defender activates automatically to maintain protection.".into(),
            category: BloatCategory::SecurityTrials,
        },
        BloatwareEntry {
            family_name_prefix: "NortonLifeLock.".into(),
            friendly_name: "Norton Security (trial)".into(),
            safety_level: SafetyLevel::Caution,
            description: "Norton antivirus trial pre-installed by OEMs. Windows Defender takes over protection automatically when Norton is removed.".into(),
            category: BloatCategory::SecurityTrials,
        },
        BloatwareEntry {
            family_name_prefix: "Symantec.".into(),
            friendly_name: "Symantec / Norton Security".into(),
            safety_level: SafetyLevel::Caution,
            description: "Symantec security suite trial. After removal, Windows Defender activates as the default antivirus.".into(),
            category: BloatCategory::SecurityTrials,
        },
        BloatwareEntry {
            family_name_prefix: "AvastSoftware.AvastSecurityForWindows".into(),
            friendly_name: "Avast Free Antivirus".into(),
            safety_level: SafetyLevel::Caution,
            description: "Avast antivirus bundled on some OEM PCs. The free version collects telemetry data. Windows Defender is a capable alternative.".into(),
            category: BloatCategory::SecurityTrials,
        },
        BloatwareEntry {
            family_name_prefix: "AVGTechnologiesCZ.AVGAntivirusFREEForWindows".into(),
            friendly_name: "AVG Antivirus FREE".into(),
            safety_level: SafetyLevel::Caution,
            description: "AVG (owned by Avast) antivirus trial. Collects usage data. Windows Defender provides equivalent protection without data collection.".into(),
            category: BloatCategory::SecurityTrials,
        },
        BloatwareEntry {
            family_name_prefix: "BullguardLtd.BullGuardInternetSecurity".into(),
            friendly_name: "BullGuard Security".into(),
            safety_level: SafetyLevel::Caution,
            description: "BullGuard antivirus trial bundled on some European OEM builds. Windows Defender activates automatically after removal.".into(),
            category: BloatCategory::SecurityTrials,
        },
        BloatwareEntry {
            family_name_prefix: "TrendMicro.".into(),
            friendly_name: "Trend Micro Security".into(),
            safety_level: SafetyLevel::Caution,
            description: "Trend Micro antivirus trial. Common on Acer and ASUS laptops. Windows Defender provides free protection after removal.".into(),
            category: BloatCategory::SecurityTrials,
        },

        // ════════════════════════════════════════════════════════════════════
        // OEM MANUFACTURER APPS
        // ════════════════════════════════════════════════════════════════════

        // ── Dell ─────────────────────────────────────────────────────────────
        BloatwareEntry {
            family_name_prefix: "DellInc.DellMobileConnect".into(),
            friendly_name: "Dell Mobile Connect".into(),
            safety_level: SafetyLevel::Safe,
            description: "Mirrors your phone screen and notifications on your Dell PC over Wi-Fi. Safe to remove if you don't use this feature.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "DellInc.DellOptimizer".into(),
            friendly_name: "Dell Optimizer".into(),
            safety_level: SafetyLevel::Safe,
            description: "AI-powered performance tuning tool for Dell laptops. Adjusts CPU, battery, and network resources based on usage. Safe to remove.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "DellInc.DellPowerManager".into(),
            friendly_name: "Dell Power Manager".into(),
            safety_level: SafetyLevel::Caution,
            description: "Battery charge limiter and power plan manager for Dell laptops. Caution: removing it disables the battery threshold feature.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "DellInc.DellUpdate".into(),
            friendly_name: "Dell Update".into(),
            safety_level: SafetyLevel::Caution,
            description: "Automatic driver and BIOS update utility for Dell PCs. Caution: removing it means you must manually update drivers from Dell's website.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "DellInc.DellSupportAssist".into(),
            friendly_name: "Dell SupportAssist".into(),
            safety_level: SafetyLevel::Caution,
            description: "Automated PC health scan, diagnostic, and driver update tool. Known to run background scans and collect diagnostics. Remove if you maintain drivers manually.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "DellInc.DellDigitalDelivery".into(),
            friendly_name: "Dell Digital Delivery".into(),
            safety_level: SafetyLevel::Safe,
            description: "Delivers Dell-purchased software licenses to your PC. Safe to remove once any purchased software has been activated.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "DellInc.DellProductRegistration".into(),
            friendly_name: "Dell Product Registration".into(),
            safety_level: SafetyLevel::Safe,
            description: "Prompts you to register your Dell product for warranty. Safe to remove once registered (or ignored).".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "DellInc.PartnerPromo".into(),
            friendly_name: "Dell Partner Promotions".into(),
            safety_level: SafetyLevel::Safe,
            description: "Displays promotional offers from Dell's partner companies. Ad-like app — completely safe to remove.".into(),
            category: BloatCategory::Oem,
        },

        // ── HP ────────────────────────────────────────────────────────────────
        BloatwareEntry {
            family_name_prefix: "AD2F1837.MyHP".into(),
            friendly_name: "My HP".into(),
            safety_level: SafetyLevel::Safe,
            description: "HP hub app for system info, support, and HP promotions. Decorative — no critical hardware functions.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "AD2F1837.HPSupportAssistant".into(),
            friendly_name: "HP Support Assistant".into(),
            safety_level: SafetyLevel::Caution,
            description: "Automated diagnostics and driver update tool for HP PCs. Caution: removing means you must download HP drivers manually from hp.com.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "AD2F1837.HPPrivacySettings".into(),
            friendly_name: "HP Privacy Settings".into(),
            safety_level: SafetyLevel::Safe,
            description: "Manages HP's telemetry and data sharing opt-ins. Safe to remove after adjusting your preferences.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "AD2F1837.HPQuickDrop".into(),
            friendly_name: "HP Quick Drop".into(),
            safety_level: SafetyLevel::Safe,
            description: "Wireless file transfer tool between your HP PC and phone. Safe to remove if you use AirDrop alternatives or USB.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "AD2F1837.HPJumpStart".into(),
            friendly_name: "HP Jump Start".into(),
            safety_level: SafetyLevel::Safe,
            description: "HP onboarding experience for new PCs. Only useful on first setup — safe to remove afterward.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "AD2F1837.HPPowerManager".into(),
            friendly_name: "HP Power Manager".into(),
            safety_level: SafetyLevel::Caution,
            description: "Battery charge limiter for HP laptops. Caution: removing it disables the adaptive charge feature that protects long-term battery health.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "AD2F1837.HPPCHardwareDiagnosticsWindows".into(),
            friendly_name: "HP PC Hardware Diagnostics".into(),
            safety_level: SafetyLevel::Caution,
            description: "Hardware self-test tool for HP PCs. Useful for troubleshooting — remove only if you have no need for hardware diagnostics.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "AD2F1837.HPSystemEventUtility".into(),
            friendly_name: "HP System Event Utility".into(),
            safety_level: SafetyLevel::Caution,
            description: "Handles hardware button events on HP laptops (volume keys, screen off, etc.). Caution: removing may break some hardware shortcut keys.".into(),
            category: BloatCategory::Oem,
        },

        // ── Lenovo ────────────────────────────────────────────────────────────
        BloatwareEntry {
            family_name_prefix: "E046963F.LenovoCompanion".into(),
            friendly_name: "Lenovo Companion".into(),
            safety_level: SafetyLevel::Safe,
            description: "System health monitor and update hub for Lenovo PCs. Safe to remove if you manage drivers manually.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "E046963F.LenovoSettings".into(),
            friendly_name: "Lenovo Settings".into(),
            safety_level: SafetyLevel::Caution,
            description: "Manages Lenovo-specific hardware settings like camera AI features, audio modes, and keyboard backlight. Caution: some settings may only be accessible here.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "E046963F.LenovoID".into(),
            friendly_name: "Lenovo ID".into(),
            safety_level: SafetyLevel::Safe,
            description: "Lenovo account and warranty portal app. Safe to remove once you've registered your device.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "LenovoInc.LenovoVantage".into(),
            friendly_name: "Lenovo Vantage".into(),
            safety_level: SafetyLevel::Caution,
            description: "All-in-one Lenovo hub for drivers, battery protection, and hardware features. Caution: battery conservation mode and some keyboard shortcuts depend on this app.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "LenovoInc.LenovoSmartEngine".into(),
            friendly_name: "Lenovo Smart Engine".into(),
            safety_level: SafetyLevel::Safe,
            description: "Performance optimization assistant for Lenovo gaming laptops. Safe to remove if you use Windows' built-in power plans instead.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "LenovoInc.LenovoWelcome".into(),
            friendly_name: "Lenovo Welcome".into(),
            safety_level: SafetyLevel::Safe,
            description: "First-run onboarding tour app for Lenovo PCs. Only relevant on first setup — safe to remove.".into(),
            category: BloatCategory::Oem,
        },

        // ── ASUS ─────────────────────────────────────────────────────────────
        BloatwareEntry {
            family_name_prefix: "B9ECED6F.ASUSPCAssistant".into(),
            friendly_name: "ASUS PC Assistant".into(),
            safety_level: SafetyLevel::Safe,
            description: "ASUS system info and support hub. Safe to remove if you don't need ASUS-branded support tools.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "ASUSTeKComputerInc.MyASUS".into(),
            friendly_name: "MyASUS".into(),
            safety_level: SafetyLevel::Caution,
            description: "ASUS control center for diagnostics, driver updates, and battery care. Caution: battery health mode and screen color profiles are managed here on some models.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "ASUSTeKComputerInc.GiftBoxExpress".into(),
            friendly_name: "ASUS Gift Box".into(),
            safety_level: SafetyLevel::Safe,
            description: "ASUS promotional app that installs or advertises partner software. Completely safe to remove.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "ASUSTeKComputerInc.ArmouryCrate".into(),
            friendly_name: "Armoury Crate".into(),
            safety_level: SafetyLevel::Caution,
            description: "ASUS gaming hub for RGB lighting, fan curves, and Aura Sync. Caution: removing it resets per-device RGB settings and disables ASUS AI cooling profiles.".into(),
            category: BloatCategory::Oem,
        },

        // ── Acer ─────────────────────────────────────────────────────────────
        BloatwareEntry {
            family_name_prefix: "AcerIncorporated.AcerCare".into(),
            friendly_name: "Acer Care Center".into(),
            safety_level: SafetyLevel::Caution,
            description: "Acer's diagnostics, driver updates, and battery management center. Caution: battery health charging mode is only accessible through this app on many Acer laptops.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "AcerIncorporated.QuickAccess".into(),
            friendly_name: "Acer Quick Access".into(),
            safety_level: SafetyLevel::Safe,
            description: "Shortcut manager for Acer-specific hotkeys and features. Safe to remove; hotkeys may become non-functional.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "7EEC8D6E.AcerCollectionS".into(),
            friendly_name: "Acer Collection S".into(),
            safety_level: SafetyLevel::Safe,
            description: "Acer app bundle launcher pre-installed on new Acer PCs. Promotional in nature — safe to remove.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "AcerIncorporated.AcerConfiguration".into(),
            friendly_name: "Acer Configuration Manager".into(),
            safety_level: SafetyLevel::Safe,
            description: "Manages Acer OEM customization and default app settings. Safely removable after initial setup.".into(),
            category: BloatCategory::Oem,
        },

        // ── MSI ──────────────────────────────────────────────────────────────
        BloatwareEntry {
            family_name_prefix: "MSIInc.MSICenter".into(),
            friendly_name: "MSI Center".into(),
            safety_level: SafetyLevel::Caution,
            description: "MSI's all-in-one hub for RGB, fan control, overclocking, and Gaming Mode. Caution: removing it disables per-app cooling profiles and some fan curve customizations.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "MSIInc.MSICommandCenter".into(),
            friendly_name: "MSI Command Center".into(),
            safety_level: SafetyLevel::Caution,
            description: "Legacy MSI overclocking and fan control utility. Replaced by MSI Center on newer boards — safe to remove if you use MSI Center instead.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "MSIInc.MSIDragonCenter".into(),
            friendly_name: "MSI Dragon Center".into(),
            safety_level: SafetyLevel::Caution,
            description: "Older MSI gaming hub (predecessor to MSI Center). Safe to remove if MSI Center is already installed.".into(),
            category: BloatCategory::Oem,
        },

        // ── Samsung ───────────────────────────────────────────────────────────
        BloatwareEntry {
            family_name_prefix: "SAMSUNGELECTRONICSCO.LTD.SamsungSettings".into(),
            friendly_name: "Samsung Settings".into(),
            safety_level: SafetyLevel::Caution,
            description: "Samsung-specific hardware settings for Samsung laptops (Galaxy Book series). Caution: some display and battery features may only be adjustable here.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "SAMSUNGELECTRONICSCO.LTD.SamsungUpdate".into(),
            friendly_name: "Samsung Update".into(),
            safety_level: SafetyLevel::Caution,
            description: "Automatic driver and firmware updater for Samsung PCs. Caution: removing means manual driver updates from Samsung's website.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "SAMSUNGELECTRONICSCO.LTD.SamsungFlowApp".into(),
            friendly_name: "Samsung Flow".into(),
            safety_level: SafetyLevel::Safe,
            description: "Links your Samsung phone to your Samsung PC for notifications and file sharing. Safe to remove if you don't use this feature.".into(),
            category: BloatCategory::Oem,
        },
        BloatwareEntry {
            family_name_prefix: "SAMSUNGELECTRONICSCO.LTD.SamsungDeXforPC".into(),
            friendly_name: "Samsung DeX".into(),
            safety_level: SafetyLevel::Safe,
            description: "Runs your Samsung phone's DeX desktop mode on your PC screen. Only useful if you have a compatible Samsung phone and use DeX.".into(),
            category: BloatCategory::Oem,
        },
    ]
}

const SYSTEM_CRITICAL_PREFIXES: &[&str] = &[
    "Microsoft.Windows.StartMenuExperienceHost",
    "Microsoft.Windows.ShellExperienceHost",
    "Microsoft.Windows.Search",
    "Microsoft.AAD",
    "Microsoft.AccountsControl",
    "Microsoft.BioEnrollment",
    "Microsoft.CredDialogHost",
    "Microsoft.ECApp",
    "Microsoft.LockApp",
    "Microsoft.MicrosoftEdgeDevToolsClient",
    "Microsoft.Win32WebViewHost",
    "Microsoft.Windows.Apprep",
    "Microsoft.Windows.AssignedAccessLockApp",
    "Microsoft.Windows.CloudExperienceHost",
    "Microsoft.Windows.ContentDeliveryManager",
    "Microsoft.Windows.OOBENetworkCaptivePortal",
    "Microsoft.Windows.PeopleExperienceHost",
    "Microsoft.Windows.PinningConfirmationDialog",
    "Microsoft.XboxGameCallableUI",
];

pub async fn get_installed_apps() -> Result<Vec<AppInfo>, AppError> {
    let output = timeout(
        QUERY_TIMEOUT,
        tokio::process::Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; \
                 $OutputEncoding = [System.Text.Encoding]::UTF8; \
                 Get-AppxPackage -AllUsers \
                 | Select-Object Name, PackageFullName, PackageFamilyName, Publisher, Version \
                 | ConvertTo-Json -Compress",
            ])
            .output(),
    )
    .await
    .map_err(|_| AppError::Custom("get_installed_apps timed out".into()))?
    .map_err(AppError::Io)?;

    if !output.status.success() {
        return Err(AppError::PowerShell(
            String::from_utf8_lossy(&output.stderr).to_string(),
        ));
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    let raw_json = json_str.trim();

    let raw: Vec<serde_json::Value> = if raw_json.is_empty() {
        Vec::new()
    } else if raw_json.starts_with('[') {
        serde_json::from_str(raw_json).map_err(|e| AppError::Parse(e.to_string()))?
    } else {
        vec![serde_json::from_str(raw_json).map_err(|e| AppError::Parse(e.to_string()))?]
    };

    let db = get_bloatware_database();

    let apps: Vec<AppInfo> = raw
        .into_iter()
        .filter_map(|v| parse_app_entry(v, &db))
        .collect();

    Ok(apps)
}

fn parse_app_entry(entry: serde_json::Value, db: &[BloatwareEntry]) -> Option<AppInfo> {
    let name = entry["Name"].as_str()?.to_string();
    let package_full_name = entry["PackageFullName"].as_str()?.to_string();
    let package_family_name = entry["PackageFamilyName"]
        .as_str()
        .unwrap_or("")
        .to_string();
    let publisher = entry["Publisher"].as_str().unwrap_or("").to_string();
    let version = entry["Version"].as_str().unwrap_or("").to_string();

    // Skip system-critical apps
    let is_critical = SYSTEM_CRITICAL_PREFIXES
        .iter()
        .any(|p| name.starts_with(p) || package_family_name.starts_with(p));

    if is_critical {
        return None;
    }

    // Match against bloatware database
    let db_entry = db.iter().find(|e| {
        name.starts_with(&e.family_name_prefix)
            || package_family_name.starts_with(&e.family_name_prefix)
    })?;

    Some(AppInfo {
        name: db_entry.friendly_name.clone(),
        package_full_name,
        package_family_name,
        publisher,
        version,
        safety_level: db_entry.safety_level.clone(),
        description: db_entry.description.clone(),
        category: db_entry.category.clone(),
    })
}

pub async fn remove_apps(package_full_names: Vec<String>) -> Result<Vec<RemoveResult>, AppError> {
    tracing::info!(count = package_full_names.len(), "removing apps");
    let allowed_packages: HashSet<String> = get_installed_apps()
        .await?
        .into_iter()
        .map(|app| app.package_full_name)
        .collect();
    let mut results = Vec::new();

    for pkg in package_full_names {
        if !allowed_packages.contains(&pkg) {
            results.push(RemoveResult {
                package_full_name: pkg,
                success: false,
                error: Some("package is not in the removable apps list".to_string()),
            });
            continue;
        }

        let result = remove_single_app(&pkg).await;
        results.push(result);
    }

    Ok(results)
}

/// Removes a single AppX package.
///
/// The package name is passed via an environment variable (`FIALHO_PKG_NAME`)
/// rather than being interpolated into the PowerShell command string. This
/// eliminates PowerShell command-injection risk regardless of the package name's
/// content (quotes, dollar signs, newlines, etc.).
async fn remove_single_app(package_full_name: &str) -> RemoveResult {
    let result = timeout(
        REMOVAL_TIMEOUT,
        tokio::process::Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "Remove-AppxPackage -Package $env:FIALHO_PKG_NAME -AllUsers -ErrorAction Stop",
            ])
            .env("FIALHO_PKG_NAME", package_full_name)
            .output(),
    )
    .await;

    match result {
        Err(_) => RemoveResult {
            package_full_name: package_full_name.to_string(),
            success: false,
            error: Some("operation timed out".to_string()),
        },
        Ok(Err(e)) => RemoveResult {
            package_full_name: package_full_name.to_string(),
            success: false,
            error: Some(e.to_string()),
        },
        Ok(Ok(o)) if o.status.success() => RemoveResult {
            package_full_name: package_full_name.to_string(),
            success: true,
            error: None,
        },
        Ok(Ok(o)) => RemoveResult {
            package_full_name: package_full_name.to_string(),
            success: false,
            error: Some(String::from_utf8_lossy(&o.stderr).trim().to_string()),
        },
    }
}
