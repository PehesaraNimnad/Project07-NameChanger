-- ╔══════════════════════════════════════════════╗
-- ║       Admin Name Change - Config             ║
-- ║       QBCore / QBX | oxmysql                 ║
-- ╚══════════════════════════════════════════════╝

Config = {}

-- Command to open the menu
Config.Command = 'namechange'

-- Keybind to open menu (set nil to disable)
Config.Keybind = nil -- example: 'F5'

Config.AllowedDiscordIDs = { -- add admin discord ids 
    '1167016442961592340',
}

-- Notification style: 'qb' or 'ox'
Config.NotifyStyle = 'ox'

-- Log to discord webhook (set nil to disable)
Config.DiscordWebhook = 'https://discord.com/api/webhooks/' -- 'https://discord.com/api/webhooks/...'

-- Max character length for first/last name
Config.MaxNameLength = 30
Config.MinNameLength = 2

-- Database table and columns (default QBX/QBCore)
Config.DB = {
    Table      = 'players',
    CitizenCol = 'citizenid',
    CharInfo   = 'charinfo',
}
