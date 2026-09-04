const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const weatherDescriptions = {
  'sunny': '☀️ Clear skies',
  'cloudy': '☁️ Overcast skies',
  'rain': '🌧️ Rain expected',
  'thunderstorm': '⛈️ Thunderstorms',
  'snow': '❄️ Snowfall',
  'fog': '🌫️ Foggy conditions',
  'windy': '💨 Windy conditions',
};

const cities = {
  'new york': { temp: 22, condition: 'sunny', humidity: 55, wind: 12 },
  'london': { temp: 15, condition: 'cloudy', humidity: 72, wind: 18 },
  'tokyo': { temp: 28, condition: 'rain', humidity: 80, wind: 8 },
  'paris': { temp: 18, condition: 'sunny', humidity: 48, wind: 14 },
  'sydney': { temp: 24, condition: 'sunny', humidity: 60, wind: 16 },
  'dubai': { temp: 38, condition: 'sunny', humidity: 30, wind: 10 },
  'mumbai': { temp: 32, condition: 'rain', humidity: 85, wind: 6 },
  'berlin': { temp: 16, condition: 'cloudy', humidity: 65, wind: 15 },
  'moscow': { temp: 8, condition: 'snow', humidity: 78, wind: 20 },
  'beijing': { temp: 20, condition: 'fog', humidity: 70, wind: 8 },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Get weather info for a city')
    .addStringOption(opt => opt.setName('city').setDescription('City name').setRequired(true)),
  cooldown: 5,
  async execute(message, args, client) {
    const city = (message.options?.getString('city') || args.join(' ')).toLowerCase();
    if (!city) return message.reply('Give me a city name!');

    let data = cities[city];
    if (!data) {
      data = {
        temp: Math.floor(Math.random() * 40) - 5,
        condition: Object.keys(weatherDescriptions)[Math.floor(Math.random() * Object.keys(weatherDescriptions).length)],
        humidity: Math.floor(Math.random() * 60) + 30,
        wind: Math.floor(Math.random() * 30) + 2,
      };
    }

    const desc = weatherDescriptions[data.condition] || data.condition;

    const embed = new EmbedBuilder()
      .setColor('#3b82f6')
      .setTitle(`🌤️ Weather in ${city.charAt(0).toUpperCase() + city.slice(1)}`)
      .setDescription(desc)
      .addFields(
        { name: '🌡️ Temperature', value: `${data.temp}°C / ${Math.round(data.temp * 9/5 + 32)}°F`, inline: true },
        { name: '💧 Humidity', value: `${data.humidity}%`, inline: true },
        { name: '💨 Wind', value: `${data.wind} km/h`, inline: true },
      )
      .setFooter({ text: 'Simulated weather data' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
