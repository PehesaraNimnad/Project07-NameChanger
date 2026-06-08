<div align="center">

<!-- Add your banner image here -->
![Banner](https://i.imgur.com/ECSZ75J.png)

# [Project07](https://project-07-store.tebex.io/)

# 🔧 Project07 Name Change
### FiveM QBX / QBCore | Real-Time Player Name Editor

![FiveM](https://img.shields.io/badge/FiveM-QBX%20%2F%20QBCore-blue?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgo=)
![oxmysql](https://img.shields.io/badge/Database-oxmysql-orange?style=for-the-badge)
![ox_lib](https://img.shields.io/badge/Library-ox__lib-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

*Change any player's first and last name in real-time — no server restart, no player reconnect required.*

</div>

---

## 📸 Preview

![Preview](https://i.imgur.com/Qpn3SaK.png)

---

## ✨ Features

- 🔴 **Real-Time Name Change** — Updates the player's name live without any restart
- 🟢 **Online Player List** — See all connected players with their Citizen ID
- 🔵 **Offline Search** — Search any player by Citizen ID even if they're not online
- 🔐 **Discord ID Whitelist** — Only specific Discord accounts can access the panel
- 📋 **Discord Webhook Logging** — Every name change is logged with admin info
- 🎨 **Clean NUI** — Minimal, lag-free, dark-themed admin panel
- 📢 **Player Notification** — The affected player gets notified when their name is changed
- ⌨️ **Keybind Support** — Open the menu with a configurable keybind

---

## 📦 Dependencies

| Resource | Required | Link |
|----------|----------|------|
| `qbx_core` | ✅ Yes | [qbx-core](https://github.com/qbx-core/qbx_core) |
| `oxmysql` | ✅ Yes | [oxmysql](https://github.com/overextended/oxmysql) |
| `ox_lib` | ✅ Yes | [ox_lib](https://github.com/overextended/ox_lib) |

---

## 📁 File Structure

```
Project07_NameChanger/
├── fxmanifest.lua
├── config.lua
├── client/
│   └── main.lua
├── server/
│   └── main.lua
└── html/
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

---

## 🚀 Installation

**1. Download and place the resource**
```
resources/
└── [admin]/
    └── Project07_NameChanger/   ← place here
```

**2. Add to `server.cfg`**
```cfg
ensure Project07_NameChanger
```

**3. Restart your server**

---

## ⚙️ Configuration

Open `config.lua` and set your allowed Discord IDs:

```lua
Config.AllowedDiscordIDs = {
    '123456789012345678',   -- Your Discord ID here
    -- '987654321098765432', -- Add more if needed
}
```

> **How to find your Discord ID:**
> Discord → Settings → Advanced → Enable **Developer Mode**
> Then right-click your profile → **Copy User ID**

**Or use the in-game debug command:**
```
/myid
```
This will print your Discord ID directly to your screen and the server console.

---

## 🎮 Usage

| Action | How |
|--------|-----|
| Open menu | `/namechange` or press `F6` |
| Find online player | Click any player from the list |
| Find offline player | Type Citizen ID → click **Search** |
| Apply change | Fill First Name + Last Name → click **Apply Change** |
| Close menu | Click ✕ or press `ESC` |

---

## 🔐 Permission System

Access is controlled by **Discord ID whitelist** only.

```
Player joins server
        ↓
Runs /namechange
        ↓
Server reads player's Discord identifier
        ↓
Checks against Config.AllowedDiscordIDs list
        ↓
✅ Match found → Menu opens
❌ No match   → Access denied
```

No QBCore groups or ACE permissions are used — Discord ID is the only gate.

---

## 📝 Discord Webhook Log

Enable logging by adding your webhook URL in `config.lua`:

```lua
Config.DiscordWebhook = 'https://discord.com/api/webhooks/YOUR_WEBHOOK_URL'
```

Each log contains:
- Admin's Discord mention
- Target Citizen ID
- Old name → New name
- Timestamp

---

## 🗄️ Database

Uses the default QBX `players` table. No extra SQL required.

| Column | Type | Usage |
|--------|------|-------|
| `citizenid` | VARCHAR | Player lookup |
| `charinfo` | JSON | Stores `firstname` and `lastname` |

---

## 🛠️ Config Reference

```lua
Config.Command        = 'namechange'    -- Command to open menu
Config.Keybind        = 'F6'            -- Keybind (set nil to disable)
Config.NotifyStyle    = 'ox'            -- 'ox' or 'qb'
Config.DiscordWebhook = nil             -- Webhook URL or nil
Config.MinNameLength  = 2              -- Minimum name length
Config.MaxNameLength  = 30             -- Maximum name length

Config.DB = {
    Table      = 'players',
    CitizenCol = 'citizenid',
    CharInfo   = 'charinfo',
}
```

---

## ❓ Troubleshooting

**"No permission" error**
- Run `/myid` and copy the ID shown
- Paste it into `Config.AllowedDiscordIDs` in `config.lua`
- Restart the resource

**"Discord NOT linked" error**
- Open FiveM Launcher → Settings → Link your Discord account
- Rejoin the server

**Players not showing in list**
- Make sure `qbx_core` is started before this resource
- Check server console for any export errors

---

## 📄 License

This project is licensed under the **MIT License** — free to use, modify, and share.

---

<div align="center">

Made with ❤️ for the FiveM community

</div>