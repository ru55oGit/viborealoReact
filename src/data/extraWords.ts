// Palabras comunes (profesiones, en su mayoría) que faltan en
// an-array-of-spanish-words, tomadas de Tuttifrutalo/Enganchalo.
export const EXTRA_WORDS_ES: string[] = [
  "Ambientalista", "Cerrajera", "Carretillera", "Fonoaudiólogo", "Fonoaudióloga", "Imprentero",
  "Imprentera", "Lutier", "Mercadólogo", "Mercadóloga", "Maquetador", "Maquetadora", "Nutriólogo",
  "Nutrióloga", "Naturópata", "Optometrista", "Plomera", "Soldadora", "Tanatoesteticista",
  "Tanatopractor", "Tanatopractora", "Tatuador", "Tatuadora", "Wifi", "Kiwi",
];

// Países, capitales y ciudades grandes en inglés (misma lista que
// Enganchalo, 2026-10-13) — confirmado por gameplay real que "ROME" y
// "ENGLAND" no se tomaban como válidas. Mismo criterio de espacios que
// EXTRA_WORDS_ES: buildWordSet descarta cualquier entrada con espacios
// (/^[A-Z]+$/), así que acá solo suman las de una sola palabra.
export const EXTRA_WORDS_EN: string[] = [
  "afghanistan","albania","algeria","andorra","angola","argentina","armenia","australia","austria",
  "azerbaijan","bahamas","bahrain","bangladesh","barbados","belarus","belgium","belize","benin",
  "bhutan","bolivia","botswana","brazil","brunei","bulgaria","burundi","cambodia","cameroon","canada",
  "chad","chile","china","colombia","croatia","cuba","cyprus","denmark","djibouti","dominica","ecuador",
  "egypt","england","eritrea","estonia","eswatini","ethiopia","fiji","finland","france","gabon",
  "gambia","georgia","germany","ghana","greece","greenland","grenada","guatemala","guinea","guyana",
  "haiti","honduras","hungary","iceland","india","indonesia","iran","iraq","ireland","israel","italy",
  "jamaica","japan","jordan","kazakhstan","kenya","kiribati","kosovo","kuwait","laos","latvia",
  "lebanon","lesotho","liberia","libya","liechtenstein","lithuania","luxembourg","madagascar","malawi",
  "malaysia","maldives","mali","malta","mauritania","mauritius","mexico","moldova","monaco","mongolia",
  "montenegro","morocco","mozambique","myanmar","namibia","nauru","nepal","nicaragua","niger","nigeria",
  "norway","oman","pakistan","palau","panama","paraguay","peru","philippines","poland","portugal",
  "qatar","romania","russia","rwanda","samoa","scotland","senegal","serbia","seychelles","singapore",
  "slovakia","slovenia","somalia","spain","sudan","suriname","sweden","switzerland","syria","taiwan",
  "tajikistan","tanzania","thailand","togo","tonga","tunisia","turkey","turkmenistan","tuvalu","uganda",
  "ukraine","uruguay","uzbekistan","vanuatu","venezuela","vietnam","wales","yemen","zambia","zimbabwe",
  "kabul","tirana","algiers","luanda","yerevan","canberra","vienna","baku","nassau","manama","dhaka",
  "bridgetown","minsk","brussels","thimphu","sucre","sarajevo","gaborone","brasilia","sofia",
  "ouagadougou","bujumbura","yaounde","ottawa","praia","bangui","santiago","beijing","bogota","moroni",
  "zagreb","havana","nicosia","copenhagen","roseau","quito","cairo","malabo","asmara","tallinn",
  "mbabane","suva","helsinki","paris","libreville","banjul","tbilisi","berlin","accra","athens","nuuk",
  "conakry","georgetown","tegucigalpa","budapest","reykjavik","jakarta","tehran","baghdad","dublin",
  "jerusalem","rome","abidjan","kingston","tokyo","amman","astana","nairobi","tarawa","pristina",
  "bishkek","vientiane","riga","beirut","maseru","monrovia","tripoli","vaduz","vilnius","antananarivo",
  "lilongwe","male","bamako","valletta","nouakchott","chisinau","monaco","ulaanbaatar","podgorica",
  "rabat","maputo","naypyidaw","windhoek","yaren","kathmandu","amsterdam","managua","niamey","abuja",
  "pyongyang","skopje","oslo","muscat","islamabad","manila","warsaw","lisbon","doha","bucharest",
  "moscow","kigali","apia","riyadh","edinburgh","dakar","belgrade","victoria","freetown","bratislava",
  "ljubljana","honiara","mogadishu","pretoria","seoul","juba","madrid","colombo","khartoum","stockholm",
  "bern","damascus","taipei","dushanbe","dodoma","bangkok","lome","tunis","ankara","ashgabat","funafuti",
  "kampala","kyiv","london","washington","montevideo","tashkent","caracas","hanoi","sanaa","lusaka",
  "harare","cardiff","chicago","toronto","vancouver","montreal","barcelona","munich","milan","naples",
  "frankfurt","hamburg","seville","valencia","bilbao","dubai","shanghai","mumbai","bangalore","kolkata",
  "istanbul","osaka","kyoto","alexandria","johannesburg","medellin","guadalajara","monterrey","cordoba",
  "porto","genoa","turin","lyon","marseille","nice","geneva","zurich","manchester","liverpool","miami",
  "houston","boston","seattle","dallas","atlanta","philadelphia","detroit","phoenix","birmingham",
  "glasgow","belfast","sydney","melbourne","brisbane","auckland","guangzhou","shenzhen",
];
