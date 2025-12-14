export async function GET(request: Request) {
  const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");

  if (!lat || !lon) {
    return new Response(
      JSON.stringify({ error: "Missing lat or lon parameter" }),
      { status: 400 }
    );
  }
  try {
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    if (!weatherResponse.ok || !forecastResponse.ok) {
      const status =
        weatherResponse.status !== 200
          ? weatherResponse.status
          : forecastResponse.status;
      console.error(`OpenWeatherMap API error: ${status}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Weather/Forecast API error: ${status}`,
        }),
        { status: weatherResponse.status }
      );
    }
    const weatherData = await weatherResponse.json();
    const forecastData = await forecastResponse.json();
    console.log("Successfully fetched weather and forecast data");

    return new Response(
      JSON.stringify({ weather: weatherData, forecast: forecastData }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Weather API proxy error:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to connect to Weather API",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
