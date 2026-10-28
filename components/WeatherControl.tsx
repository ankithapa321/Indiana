"use client";

import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Droplets, Eye, Gauge, Moon, Sun, Sunrise, Sunset, Thermometer, Wind, X, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

// WMO weather interpretation codes returned by Open-Meteo.
function describeWeather(code: number, isDay: boolean): { label: string; detail: string; Icon: LucideIcon } {
  if (code === 0) return { label: "Clear", detail: "Clear sky", Icon: isDay ? Sun : Moon };
  if (code <= 2) return { label: code === 1 ? "Mostly clear" : "Partly cloudy", detail: code === 1 ? "Mainly clear sky" : "Some clouds", Icon: isDay ? CloudSun : CloudMoon };
  if (code === 3) return { label: "Overcast", detail: "Cloudy skies", Icon: Cloud };
  if (code <= 48) return { label: "Fog", detail: "Reduced visibility", Icon: CloudFog };
  if (code <= 57) return { label: "Drizzle", detail: "Light drizzle", Icon: CloudDrizzle };
  if (code <= 67 || (code >= 80 && code <= 82)) return { label: "Rain", detail: code >= 80 ? "Rain showers" : "Rainfall", Icon: CloudRain };
  if (code <= 77 || code === 85 || code === 86) return { label: "Snow", detail: "Snowfall", Icon: CloudSnow };
  return { label: "Thunderstorm", detail: "Storms in the area", Icon: CloudLightning };
}

// Open-Meteo returns local Indianapolis times like "2026-10-26T08:05"; format them without
// re-interpreting them in the visitor's own timezone.
function formatLocalTime(iso: string) {
  const [hours, minutes] = iso.slice(11, 16).split(":").map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
}

type WeatherData = {
  current: {
    temp: number;
    apparent: number;
    humidity: number;
    windSpeed: number;
    windDir: number;
    pressure: string;
    visibility: number;
    uvIndex: number;
    dewPoint: number;
    cloudCover: number;
    isDay: number;
    weatherCode: number;
  };
  daily: {
    sunrise: string;
    sunset: string;
    maxTemp: number;
    minTemp: number;
  };
};

export function WeatherControl() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [modal, setModal] = useState(false);

  useEffect(() => {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=39.7684&longitude=-86.1581&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,uv_index,dew_point_2m,visibility&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FIndiana%2FIndianapolis";

    const load = () => fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setWeather({
          current: {
            temp: Math.round(data.current.temperature_2m),
            apparent: Math.round(data.current.apparent_temperature),
            humidity: Math.round(data.current.relative_humidity_2m),
            windSpeed: Math.round(data.current.wind_speed_10m),
            windDir: data.current.wind_direction_10m,
            pressure: (data.current.pressure_msl * 0.02953).toFixed(2),
            visibility: Math.round(data.current.visibility / 1609.34),
            uvIndex: Math.round(data.current.uv_index),
            dewPoint: Math.round(data.current.dew_point_2m),
            cloudCover: data.current.cloud_cover,
            isDay: data.current.is_day,
            weatherCode: data.current.weather_code,
          },
          daily: {
            sunrise: formatLocalTime(data.daily.sunrise[0]),
            sunset: formatLocalTime(data.daily.sunset[0]),
            maxTemp: Math.round(data.daily.temperature_2m_max[0]),
            minTemp: Math.round(data.daily.temperature_2m_min[0]),
          }
        });
      })
      .catch((err) => console.error(err));

    load();
    const timer = window.setInterval(load, 10 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const condition = describeWeather(weather?.current.weatherCode ?? 0, weather?.current.isDay !== 0);
  const ConditionIcon = condition.Icon;

  const getWindDir = (degree: number) => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return directions[Math.round(degree / 45) % 8];
  };

  const getUVLevel = (uv: number) => {
    if (uv <= 2) return "Low";
    if (uv <= 5) return "Moderate";
    if (uv <= 7) return "High";
    if (uv <= 10) return "Very High";
    return "Extreme";
  };

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    timeZone: "America/Indiana/Indianapolis"
  });
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', minute: '2-digit',
    timeZone: "America/Indiana/Indianapolis" 
  });

  return (
    <>
      {/* Clicking the button now directly opens the modal */}
      <button className="weather-pill" type="button" onClick={() => setModal(true)} aria-label="Indianapolis weather">
        <span className="weather-icon"><ConditionIcon size={25} /></span>
        <span className="weather-text">
          <b>Indianapolis, IN</b>
          <small>{condition.label} · Feels like {weather?.current.apparent ?? "--"}°F</small>
          <strong>{weather?.current.temp ?? "--"}°F</strong>
        </span>
      </button>

      {modal && weather && (
        <div className="weather-modal" role="dialog" aria-modal="true" onClick={() => setModal(false)}>
          {/* Added onClick to the card so clicking inside doesn't close the modal */}
          <div className="weather-card" onClick={(e) => e.stopPropagation()}>
            
            <div className="weather-header">
              <div>
                <h2>INDIANAPOLIS, IN</h2>
                <p className="weather-date"><ConditionIcon size={14} /> {currentDate} · {currentTime}</p>
              </div>
              <button type="button" className="close-btn" aria-label="Close weather" onClick={() => setModal(false)}><X size={20} /></button>
            </div>

            <div className="weather-main-display">
              <div className="weather-condition">
                <div className="weather-icon-large"><ConditionIcon size={48} /></div>
                <div>
                  <h3>{condition.label}</h3>
                  <p>{condition.detail}</p>
                </div>
              </div>
              <div className="weather-temp-large">
                <strong>{weather.current.temp}°</strong>
                <span>Feels like {weather.current.apparent}°</span>
              </div>
            </div>

            <div className="weather-grid">
              <div className="weather-grid-item">
                <Droplets size={18} />
                <div><span>HUMIDITY</span><strong>{weather.current.humidity}%</strong></div>
              </div>
              <div className="weather-grid-item">
                <Wind size={18} />
                <div><span>WIND</span><strong>{weather.current.windSpeed} mph {getWindDir(weather.current.windDir)}</strong></div>
              </div>
              <div className="weather-grid-item">
                <Gauge size={18} />
                <div><span>PRESSURE</span><strong>{weather.current.pressure}"</strong></div>
              </div>
              <div className="weather-grid-item">
                <Eye size={18} />
                <div><span>VISIBILITY</span><strong>{weather.current.visibility} mi</strong></div>
              </div>
              <div className="weather-grid-item">
                <Sun size={18} />
                <div><span>UV INDEX</span><strong>{weather.current.uvIndex} <small className="uv-level">{getUVLevel(weather.current.uvIndex)}</small></strong></div>
              </div>
              <div className="weather-grid-item">
                <Droplets size={18} />
                <div><span>DEW POINT</span><strong>{weather.current.dewPoint}°F</strong></div>
              </div>
              <div className="weather-grid-item">
                <CloudSun size={18} />
                <div><span>CLOUD COVER</span><strong>{weather.current.cloudCover}%</strong></div>
              </div>
              <div className="weather-grid-item">
                <Thermometer size={18} />
                <div><span>HIGH / LOW</span><strong>{weather.daily.maxTemp}° / {weather.daily.minTemp}°</strong></div>
              </div>
              <div className="weather-grid-item">
                <Sunrise size={18} />
                <div><span>SUNRISE</span><strong>{weather.daily.sunrise}</strong></div>
              </div>
              <div className="weather-grid-item">
                <Sunset size={18} />
                <div><span>SUNSET</span><strong>{weather.daily.sunset}</strong></div>
              </div>
            </div>

            <div className="weather-footer">
              <span className="live-dot"></span> Live · auto-updates every 10 min · Open-Meteo
            </div>
          </div>
        </div>
      )}
    </>
  );
}