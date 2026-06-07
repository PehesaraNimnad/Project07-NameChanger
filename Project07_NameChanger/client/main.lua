local isOpen = false

local function OpenMenu()
    if isOpen then return end
    isOpen = true

    lib.callback('adminNameChange:getPlayers', false, function(players)
        if not players then
            lib.notify({ title = 'Name Change', description = 'No permission!', type = 'error' })
            isOpen = false
            return
        end

        SetNuiFocus(true, true)
        SendNUIMessage({
            action  = 'open',
            players = players,
        })
    end)
end

local function CloseMenu()
    isOpen = false
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'close' })
end

RegisterNUICallback('closeMenu', function(_, cb)
    CloseMenu()
    cb('ok')
end)

RegisterNUICallback('searchCitizen', function(data, cb)
    lib.callback('adminNameChange:searchCitizen', false, function(result)
        cb(result or { error = 'Not found' })
    end, data.citizenid)
end)

RegisterNUICallback('changeName', function(data, cb)
    TriggerServerEvent('adminNameChange:changeName', data)
    cb('ok')
end)

RegisterNetEvent('adminNameChange:changeSuccess', function(data)
    SendNUIMessage({ action = 'changeSuccess', data = data })
end)

RegisterNetEvent('adminNameChange:updateName', function(firstname, lastname)
    SendNUIMessage({ action = 'close' })
    TriggerEvent('QBCore:Client:OnPlayerLoaded')
end)

RegisterCommand(Config.Command, function()
    OpenMenu()
end, false)

if Config.Keybind then
    RegisterKeyMapping(Config.Command, 'Open Admin Name Change', 'keyboard', Config.Keybind)
end

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(0)
        if isOpen and IsControlJustReleased(0, 200) then
            CloseMenu()
        end
    end
end)