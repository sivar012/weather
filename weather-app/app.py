from flask import Flask, render_template, request, jsonify
import requests
import os
from dotenv import load_dotenv

app = Flask(__name__)

# Load environment variables from .env file
load_dotenv()
API_KEY = os.getenv('OPENWEATHERMAP_API_KEY')

if not API_KEY:
    raise ValueError("No API key found. Please set the OPENWEATHERMAP_API_KEY environment variable.")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/weather', methods=['GET'])
def get_weather():
    city = request.args.get('city')
    lat = request.args.get('lat')
    lon = request.args.get('lon')

    if city:
        # Fetch current weather by city name
        current_weather_url = f'https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}'
        forecast_url = f'https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}'
    elif lat and lon:
        # Fetch current weather by coordinates
        current_weather_url = f'https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}'
        forecast_url = f'https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}'
    else:
        return jsonify({'error': 'Missing city or coordinates'}), 400

    try:
        # Fetch current weather
        current_response = requests.get(current_weather_url)
        current_response.raise_for_status()
        current_data = current_response.json()

        # Fetch hourly forecast
        forecast_response = requests.get(forecast_url)
        forecast_response.raise_for_status()
        forecast_data = forecast_response.json()

        # If coordinates are available, fetch daily forecast using One Call API
        daily_data = None
        if 'coord' in current_data:
            lat = current_data['coord']['lat']
            lon = current_data['coord']['lon']
            daily_forecast_url = f'https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude=current,minutely,hourly,alerts&appid={API_KEY}'
            daily_response = requests.get(daily_forecast_url)
            daily_response.raise_for_status()
            daily_data = daily_response.json()

        return jsonify({
            'current': current_data,
            'hourly': forecast_data,
            'daily': daily_data
        })

    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)