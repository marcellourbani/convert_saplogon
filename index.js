#!/usr/bin/env node
const fs = require("fs")
const xml2js = require("xml2js")

var [source, dest] = process.argv.slice(2)

if (!source || !dest)
  console.log(
    "Converts USAPGUILandscape.xml to saplogon.ini\n  Usage: convert <landscapefile> <inifile>\n"
  )
else
  fs.readFile(source, function(err, data) {
    if (err) console.log("error reading " + source + ":" + err.toString())
    else {
      var parser = new xml2js.Parser()
      parser.parseString(data, function(err2, result) {
        if (err2) console.log("error opening " + dest + ":" + err2.toString())
        else {
          var ini = convert(result)
          fs.writeFile(dest, ini, err3 => {
            if (err3)
              console.log("error writing " + dest + ":" + err2.toString())
          })
        }
      })
    }
  })

function convert(lscape) {
  const routers = lscape.Landscape.Routers[0].Router.reduce(
    (map, current, idx, array) => {
      map[current["$"].uuid] = current["$"].router
      return map
    },
    {}
  )
  var out = `[Configuration]
  SessManNewKey=52
  
  [MSLast]
  MSLast=PRO
  
  [MSWinPos]
  NormX=489
  NormY=139
  
  [Storage]
  SapLogon_Xpos=706
  SapLogon_Ypos=467
  
  `
  const tags = [
    {
      tag: "[Router]",
      convert: item => routers[item.routerid] || "",
      proc: 2
    },
    { tag: "[Router2]", template: "", proc: 0 },
    { tag: "[RouterChoice]", template: "0", proc: 0 },
    {
      tag: "[Server]",
      convert: item => item.server && item.server.split(":")[0],
      proc: 2
    },
    {
      tag: "[Database]",
      convert: item => {
        let db = item.server && item.server.split(":")[1]
        return db ? db.substr(2) : ""
      },
      proc: 2
    },
    { tag: "[System]", template: "3", proc: 0 },
    { tag: "[Description]", template: "name", proc: 1 },
    { tag: "[Address]", template: "", proc: 0 },
    { tag: "[MSSysName]", template: "systemid", proc: 1 },
    { tag: "[MSSrvName]", template: "", proc: 0 },
    { tag: "[MSSrvPort]", template: "", proc: 0 },
    { tag: "[SessManKey]", template: "-1", proc: 0 },
    { tag: "[SncName]", template: "", proc: 0 },
    { tag: "[SncChoice]", template: "-1", proc: 0 },
    { tag: "[Codepage]", template: "1100", proc: 0 },
    { tag: "[CodepageIndex]", template: "-1", proc: 0 },
    { tag: "[Origin]", template: "USEREDIT", proc: 0 },
    { tag: "[LowSpeedConnection]", template: "0", proc: 0 },
    { tag: "[Utf8Off]", template: "0", proc: 0 },
    { tag: "[EntryKey]", template: "", proc: 0 },
    { tag: "[EncodingID]", template: "DEFAULT_NON_UC", proc: 0 },
    { tag: "[ShortcutType]", template: "0", proc: 0 },
    { tag: "[ShortcutString]", template: "", proc: 0 },
    { tag: "[ShortcutTo]", template: "", proc: 0 },
    { tag: "[ShortcutBy]", template: "", proc: 0 }
  ]
  const services = lscape.Landscape.Services[0].Service.filter(
    v => v["$"].type == "SAPGUI"
  )

  for (var tagidx = 0; tagidx < tags.length; tagidx++) {
    var tag = tags[tagidx]
    out = out + "\n" + tag.tag + "\n"
    services.forEach((s, i) => {
      var value
      switch (tag.proc) {
        case 0:
          value = tag.template
          break
        case 1:
          value = s["$"][tag.template]
          break
        case 2:
          value = tag.convert(s["$"])
          break
      }
      out = out + `Item${i}=${value}\n`
    })
  }

  return out
}
