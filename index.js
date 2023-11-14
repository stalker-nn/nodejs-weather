const os = require('os');
const path = require('path');
const fs = require('fs');
const https = require('https');

const userConfPath = path.join(os.homedir(), 'defaultConfig.json');

// Если в домашней директории пользователя есть файл defaultConfig.json, то используем его.
// В противном случае используем defaultConfig.json из директории скрипта.
const config = fs.existsSync(userConfPath) ? require(userConfPath) : require('./defaultConfig.json');

// Задаем массив возможных флагов для дальнейших проверок.
const flags = ['-s', '-t', '-h'];

function showHelp() {
    console.log('Get weather for city from api.openweathermap.org');
    console.log('Usage:');
    console.log('node index [-s <city name>] [-t <api token>] [-h]');
}

function degreesToDirection(deg) {
    directions = [
        'север',
        'север-восток',
        'восток',
        'юг-восток',
        'юг',
        'юг-запад',
        'запад',
        'север-запад',
    ];
    ind = (Math.floor(deg * 8 / 360, 0) + 8) % 8;
    return directions[ind];
}

// Если присутствует флаг -h, показываем справку и останавливаем работу скрипта.
if (process.argv.indexOf('-h') > -1) {
    showHelp();
    process.exit();
}

const sourceFlagIndex = process.argv.indexOf('-s');
let sourceValue = config.city;
if (sourceFlagIndex > -1) {
    // Проверяем, чтобы в качестве значения флага -s не попадали другие флаги из массива.
    if (!flags.includes(process.argv[sourceFlagIndex + 1])) {
        sourceValue = process.argv[sourceFlagIndex + 1];
    }
}

const tokenFlagIndex = process.argv.indexOf('-t');
let tokenValue = config.token;
if (tokenFlagIndex > -1) {
    // Проверяем, чтобы в качестве значения флага -t не попадали другие флаги из массива.
    if (!flags.includes(process.argv[tokenFlagIndex + 1])) {
        tokenValue = process.argv[tokenFlagIndex + 1];
    }
}

https.get('https://api.openweathermap.org/data/2.5/weather?q=' + sourceValue + '&appid=' + tokenValue + '&units=metric', res => {
   let data = '';
   res.on('data', chunk => {
       data += chunk;
   });

   res.on('end', () => {
       try {
           if (JSON.parse(data).cod && JSON.parse(data).cod === 200) {
               console.log('Город: ', JSON.parse(data).name);
                console.log('Температура (С): ', JSON.parse(data).main.temp);
                console.log('Ощущается как (С): ', JSON.parse(data).main.feels_like);
                console.log('Атмосферное давление (мм рт. ст.): ', (JSON.parse(data).main.pressure / 1.333).toFixed());
                console.log('Влажность (%): ', JSON.parse(data).main.humidity);
                console.log('Скорость ветра (м/с): ', JSON.parse(data).wind.speed);
                console.log('Направление ветра: ', degreesToDirection(JSON.parse(data).wind.deg));
                console.log('Облачность (%): ', JSON.parse(data).clouds.all);
           } else {
               console.log('Error: ', JSON.parse(data).message)
           }
       } catch (e) {
           console.log('Error: not JSON');
       }
   });
}).on('error', err => {
    console.log('Error: ' + err.message);
});