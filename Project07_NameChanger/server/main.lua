local function GetDiscordId(source)
    local src = tonumber(source)
    for i = 0, GetNumPlayerIdentifiers(src) - 1 do
        local id = GetPlayerIdentifier(src, i)
        if id and string.sub(id, 1, 8) == 'discord:' then
            return string.sub(id, 9)
        end
    end
    return nil
end

local function IsAllowed(source)
    local discordId = GetDiscordId(source)
    if not discordId then return false end
    for _, v in ipairs(Config.AllowedDiscordIDs) do
        if tostring(v) == tostring(discordId) then
            return true
        end
    end
    return false
end

local function Notify(src, msg, ntype)
    if Config.NotifyStyle == 'ox' then
        TriggerClientEvent('ox_lib:notify', src, {
            title       = 'Name Change',
            description = msg,
            type        = ntype or 'inform',
            duration    = 6000,
        })
    else
        TriggerClientEvent('QBCore:Notify', src, msg, ntype or 'primary', 6000)
    end
end

local function DiscordLog(adminDiscord, targetCitizen, oldFirst, oldLast, newFirst, newLast)
    if not Config.DiscordWebhook then return end
    local embed = {{
        color  = 3447003,
        title  = '🔧 Player Name Changed',
        fields = {
            { name = 'Admin Discord', value = '<@'..adminDiscord..'>', inline = true  },
            { name = 'Citizen ID',   value = targetCitizen,            inline = true  },
            { name = 'Old Name',     value = oldFirst..' '..oldLast,   inline = false },
            { name = 'New Name',     value = newFirst..' '..newLast,   inline = false },
        },
        timestamp = os.date('!%Y-%m-%dT%H:%M:%SZ'),
    }}
    PerformHttpRequest(Config.DiscordWebhook, function() end, 'POST',
        json.encode({ username = 'Name Change Log', embeds = embed }),
        { ['Content-Type'] = 'application/json' }
    )
end

-- /myid command - ඔබේ Discord ID check කරන්න
RegisterCommand('myid', function(source)
    local src     = source
    local discord = GetDiscordId(src)

    print('╔══════════════════════════════════════╗')
    print('║  Player Identifiers — Server #'..src)
    print('╠══════════════════════════════════════╣')
    for i = 0, GetNumPlayerIdentifiers(src) - 1 do
        print('║  ['..i..'] '..tostring(GetPlayerIdentifier(src, i)))
    end
    print('╠══════════════════════════════════════╣')
    if discord then
        print('║  Discord ID: '..discord)
    else
        print('║  Discord NOT linked!')
    end
    print('╚══════════════════════════════════════╝')

    if discord then
        Notify(src, '🆔 Your Discord ID: '..discord, 'inform')
    else
        Notify(src, '❌ Discord linked නැහැ! FiveM ට Discord link කරන්න.', 'error')
    end
end, false)

lib.callback.register('adminNameChange:getPlayers', function(source)
    if not IsAllowed(source) then
        local discord = GetDiscordId(source)
        print('[AdminNameChange] DENIED | Server: '..source..' | Discord: '..(discord or 'NOT LINKED'))
        return nil
    end

    local list       = {}
    local allPlayers = exports.qbx_core:GetQBPlayers()

    for src, Player in pairs(allPlayers) do
        local info = Player.PlayerData.charinfo or {}
        table.insert(list, {
            source    = src,
            citizenid = Player.PlayerData.citizenid or 'N/A',
            firstname = info.firstname or 'Unknown',
            lastname  = info.lastname  or 'Unknown',
            serverId  = src,
        })
    end
    return list
end)

lib.callback.register('adminNameChange:searchCitizen', function(source, citizenid)
    if not IsAllowed(source) then return nil end
    if not citizenid or citizenid == '' then return nil end

    local result = MySQL.scalar.await(
        'SELECT charinfo FROM '..Config.DB.Table..' WHERE '..Config.DB.CitizenCol..' = ?',
        { citizenid }
    )
    if not result then return nil end

    local charinfo = json.decode(result) or {}
    return {
        citizenid = citizenid,
        firstname = charinfo.firstname or '',
        lastname  = charinfo.lastname  or '',
    }
end)

RegisterNetEvent('adminNameChange:changeName', function(data)
    local src = source

    if not IsAllowed(src) then
        local discord = GetDiscordId(src)
        print('[AdminNameChange] DENIED changeName | Discord: '..(discord or 'NOT LINKED'))
        Notify(src, '❌ No permission! Config ලා Discord ID check කරන්න.', 'error')
        return
    end

    local citizenid = tostring(data.citizenid or ''):match('^%s*(.-)%s*$')
    local newFirst  = tostring(data.firstname  or ''):match('^%s*(.-)%s*$')
    local newLast   = tostring(data.lastname   or ''):match('^%s*(.-)%s*$')

    if citizenid == '' or newFirst == '' or newLast == '' then
        Notify(src, 'Fill all fields!', 'error')
        return
    end
    if #newFirst < Config.MinNameLength or #newFirst > Config.MaxNameLength then
        Notify(src, ('First name: %d-%d chars!'):format(Config.MinNameLength, Config.MaxNameLength), 'error')
        return
    end
    if #newLast < Config.MinNameLength or #newLast > Config.MaxNameLength then
        Notify(src, ('Last name: %d-%d chars!'):format(Config.MinNameLength, Config.MaxNameLength), 'error')
        return
    end

    local row = MySQL.single.await(
        'SELECT charinfo FROM '..Config.DB.Table..' WHERE '..Config.DB.CitizenCol..' = ?',
        { citizenid }
    )
    if not row then
        Notify(src, 'Player not found in database!', 'error')
        return
    end

    local charinfo = json.decode(row.charinfo) or {}
    local oldFirst = charinfo.firstname or ''
    local oldLast  = charinfo.lastname  or ''

    charinfo.firstname = newFirst
    charinfo.lastname  = newLast

    MySQL.update.await(
        'UPDATE '..Config.DB.Table..' SET charinfo = ? WHERE '..Config.DB.CitizenCol..' = ?',
        { json.encode(charinfo), citizenid }
    )

    local allPlayers = exports.qbx_core:GetQBPlayers()
    for tsrc, P in pairs(allPlayers) do
        if P.PlayerData.citizenid == citizenid then
            P.Functions.SetPlayerData('charinfo', charinfo)
            TriggerClientEvent('adminNameChange:updateName', tsrc, newFirst, newLast)
            Notify(tsrc, ('Your name updated: %s %s'):format(newFirst, newLast), 'inform')
            break
        end
    end

    Notify(src, ('✅ Done: %s %s [%s]'):format(newFirst, newLast, citizenid), 'success')

    local adminDiscord = GetDiscordId(src) or 'unknown'
    DiscordLog(adminDiscord, citizenid, oldFirst, oldLast, newFirst, newLast)

    TriggerClientEvent('adminNameChange:changeSuccess', src, {
        citizenid = citizenid,
        firstname = newFirst,
        lastname  = newLast,
    })

    print(('[AdminNameChange] %s changed %s: "%s %s" → "%s %s"'):format(
        adminDiscord, citizenid, oldFirst, oldLast, newFirst, newLast
    ))
end)