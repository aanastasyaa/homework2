import "babel-polyfill";
import Chart from "chart.js";

const meteoURL = "/xml.meteoservice.ru/export/gismeteo/point/140.xml";

async function loadMeteoData() {
  const response = await fetch(meteoURL);
  const xmlTest = await response.text();
  const parser = new DOMParser();
  const meteoData = parser.parseFromString(xmlTest, "text/xml");
  const forecasts = meteoData.querySelectorAll("FORECAST[day][month][year][hour]");
  const result = Object.create(null);
  result.hour = [];
  result.min = [];
  result.max = [];
  result.heat = [];
  result.date = [];

  for (let forecastTag of forecasts) {
    const tempTag = forecastTag.querySelector("TEMPERATURE[max][min]");
    const min = +tempTag.getAttribute("min");
    const max = +tempTag.getAttribute("max");
    const heat = forecastTag.querySelector("HEAT[min]").getAttribute("min");
    const label = forecastTag.getAttribute("hour") + ':00';
    const date = `${forecastTag.getAttribute("day")}.${forecastTag.getAttribute("month")}.${forecastTag.getAttribute("year")}`;

    result.min.push(min);
    result.max.push(max);
    result.heat.push(heat);
    result.hour.push(label);
    result.date.push(date);
  }
  return result;
}

const buttonBuild = document.getElementById("btn");
const canvasCtx = document.getElementById("out").getContext("2d");
buttonBuild.addEventListener("click", async function() {
  const meteoData = await loadMeteoData();
  const date = meteoData.date;
  const hour = meteoData.hour;
  const temp = meteoData.min.map((el, i) => (el + meteoData.max[i]) / 2).map(x => Math.round(x));
  const heat = meteoData.heat;

  const chartConfig = {
    type: "line",

    data: {
      labels: hour,
      datasets: [
        {
          label: "Температура",
          backgroundColor: "rgb(255, 87, 51, 0.5)",
          borderColor: "rgb(255, 87, 51)",
          data: temp
        },
        {
          label: "Температура по ощущениям",
          backgroundColor: "rgb(51, 219, 255, 0.5)",
          borderColor: "rgb(51, 219, 255)",
          data: heat
        }
      ]
    },
    options: {
      scales: {
        yAxes: [
          {
            id: "temp",
            ticks: {
              beginAtZero: true,
            },
            scaleLabel: {
              display: true,
              labelString: 'Температура, \u00b0\u0043'
            }
          }
        ]
      },
      tooltips: {
        callbacks: {
          title: function(tooltipItems, data) {
            return date[tooltipItems[0].index] + ' ' + tooltipItems[0].xLabel;
          },
          label: function(tooltipItems, data) {
            let yValue = Number(tooltipItems.yLabel);
            if (yValue > 0) tooltipItems.yLabel = '+' + yValue;
            return tooltipItems.yLabel + '\u00b0\u0043';
          }
        },
        titleFontSize: 16,
        backgroundColor: '#264653',
        bodyFontSize: 14,
        displayColors: false
      }
    }
  };

  if (window.chart) {
    chart.data.labels = chartConfig.data.labels;
    chart.data.datasets[0].data = chartConfig.data.datasets[0].data;
    chart.update({
      duration: 800,
      easing: "easeOutBounce"
    });
  } else {
    window.chart = new Chart(canvasCtx, chartConfig);
  }
});
