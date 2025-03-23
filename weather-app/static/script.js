const OPENWEATHERMAP_API_KEY = '4495bce352fee4102d92010b47e5484a';

        function getWeather() {
            const city = document.getElementById('city').value;

            if (!city) {
                alert(translations[currentLanguage].enterCityAlert);
                return;
            }

            // Fetch current weather data from OpenWeatherMap
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHERMAP_API_KEY}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('City not found');
                    }
                    return response.json();
                })
                .then(currentData => {
                    displayWeather(currentData);

                    // Fetch coordinates for hourly and daily forecast
                    const lat = currentData.coord.lat;
                    const lon = currentData.coord.lon;

                    // Fetch hourly and daily forecast data
                    return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}`);
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Forecast data not available');
                    }
                    return response.json();
                })
                .then(forecastData => {
                    displayHourlyForecast(forecastData.list);

                    // Note: The free tier of OpenWeatherMap API does not provide daily forecasts beyond 5 days.
                    // For a full 10-day forecast, you would need a paid plan and use the One Call API or another endpoint.
                    // Here, we'll simulate a daily forecast by aggregating the 5-day forecast data.
                    const dailyData = aggregateDailyData(forecastData.list);
                    displayDailyForecast(dailyData);
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert(error.message === 'City not found' ? translations[currentLanguage].cityNotFound : translations[currentLanguage].weatherError);
                });
        }

        function getDefaultWeather() {
            const defaultCity = 'Vizianagaram';
            document.getElementById('city').value = defaultCity;
            getWeather();
        }

        function getWeatherByCurrentLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;

                        // Fetch current weather data from OpenWeatherMap using coordinates
                        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}`)
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Weather data not available');
                                }
                                return response.json();
                            })
                            .then(currentData => {
                                displayWeather(currentData);
                                document.getElementById('city').value = currentData.name;

                                // Fetch hourly and daily forecast data
                                return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}`);
                            })
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Forecast data not available');
                                }
                                return response.json();
                            })
                            .then(forecastData => {
                                displayHourlyForecast(forecastData.list);

                                // Simulate daily forecast by aggregating the 5-day forecast data
                                const dailyData = aggregateDailyData(forecastData.list);
                                displayDailyForecast(dailyData);
                            })
                            .catch(error => {
                                console.error('Error:', error);
                                alert(translations[currentLanguage].weatherError);
                            });
                    },
                    error => {
                        console.error('Error:', error);
                        alert(translations[currentLanguage].locationError);
                    }
                );
            } else {
                alert(translations[currentLanguage].geoNotSupported);
            }
        }

        function displayWeather(data) {
            const tempDivInfo = document.getElementById('temp-div');
            const weatherInfoDiv = document.getElementById('weather-info');
            const weatherIcon = document.getElementById('weather-icon');

            // Clear previous content
            weatherInfoDiv.innerHTML = '';
            tempDivInfo.innerHTML = '';

            const cityName = data.name;
            const temperature = Math.round(data.main.temp - 273.15);
            const description = data.weather[0].description;
            const feelsLike = Math.round(data.main.feels_like - 273.15);
            const humidity = data.main.humidity;
            const windSpeed = data.wind.speed;
            const iconCode = data.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

            const temperatureHTML = `<p>${temperature}°C</p>`;
            const weatherHtml = `
                <p>${cityName}</p>
                <p>${description}</p>
                <p>${translations[currentLanguage].feelsLike}: ${feelsLike}°C</p>
                <p>${translations[currentLanguage].humidity}: ${humidity}%</p>
                <p>${translations[currentLanguage].wind}: ${windSpeed} m/s</p>
            `;

            tempDivInfo.innerHTML = temperatureHTML;
            weatherInfoDiv.innerHTML = weatherHtml;
            weatherIcon.src = iconUrl;
            weatherIcon.alt = description;
            weatherIcon.style.display = 'block';
        }

        function displayHourlyForecast(hourlyData) {
            const hourlyForecastDiv = document.getElementById('hourly-forecast');
            hourlyForecastDiv.innerHTML = '';

            const next24Hours = hourlyData.slice(0, 12);

            next24Hours.forEach(item => {
                const dateTime = new Date(item.dt * 1000);
                const hour = dateTime.getHours();
                const temperature = Math.round(item.main.temp - 273.15);
                const iconCode = item.weather[0].icon;
                const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;

                const hourlyItemHtml = `
                    <div class="hourly-item">
                        <span>${hour}:00</span>
                        <img src="${iconUrl}" alt="Hourly Weather Icon">
                        <span>${temperature}°C</span>
                    </div>
                `;

                hourlyForecastDiv.innerHTML += hourlyItemHtml;
            });
        }

        function aggregateDailyData(hourlyData) {
            const dailyData = [];
            const days = {};
            hourlyData.forEach(item => {
                const date = new Date(item.dt * 1000).toLocaleDateString();
                if (!days[date]) {
                    days[date] = {
                        dt: item.dt,
                        temp: { max: item.main.temp, min: item.main.temp },
                        weather: item.weather,
                        pop: item.pop
                    };
                } else {
                    days[date].temp.max = Math.max(days[date].temp.max, item.main.temp);
                    days[date].temp.min = Math.min(days[date].temp.min, item.main.temp);
                    days[date].pop = Math.max(days[date].pop, item.pop);
                }
            });
            for (const day in days) {
                dailyData.push(days[day]);
            }
            return dailyData.slice(0, 10); // Extend to 10 days
        }
        
        function displayDailyForecast(dailyData) {
            const dailyForecastDiv = document.getElementById('daily-forecast');
            dailyForecastDiv.innerHTML = '';
            const next10Days = dailyData.slice(0, 10);  // Display 10 days
            // Rest of the function remains the same
            next10Days.forEach(item => {
                const date = new Date(item.dt * 1000);
                const dayName = getDayName(date);
                const maxTemp = Math.round(item.temp.max - 273.15);
                const minTemp = Math.round(item.temp.min - 273.15);
                const iconCode = item.weather[0].icon;
                const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;
                const precipitation = item.pop * 100; // Probability of precipitation in percentage
                const description = item.weather[0].description; // Weather description

                const dailyItemHtml = `
                    <div class="daily-item">
                        <span>${dayName} (${date.toLocaleDateString()})</span>
                        <img src="${iconUrl}" alt="${description}">
                        <div class="temp-range">
                            <span class="high">${translations[currentLanguage].high}: ${maxTemp}°C</span>
                            <span class="low">${translations[currentLanguage].low}: ${minTemp}°C</span>
                        </div>
                        <span>${translations[currentLanguage].precipitation}: ${precipitation.toFixed(0)}%</span>
                        <span>${description}</span>
                    </div>
                `;

                dailyForecastDiv.innerHTML += dailyItemHtml;
            });

            // If fewer than 10 days are available, display a note
            if (next10Days.length < 10) {
                dailyForecastDiv.innerHTML += `
                    <p style="text-align: center; color: #666;">
                        ${translations[currentLanguage].forecastLimitNote.replace('{days}', next10Days.length)}
                    </p>
                `;
            }
        }

        function getDayName(date) {
            const days = translations[currentLanguage].days || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return days[date.getDay()];
        }

        // Voice search functionality
        function startVoiceSearch() {
            if (!('webkitSpeechRecognition' in window)) {
                alert(translations[currentLanguage].voiceNotSupported);
                return;
            }

            const recognition = new webkitSpeechRecognition();
            recognition.lang = getRecognitionLanguage(currentLanguage);
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = function() {
                document.getElementById('voice-search-btn').classList.add('listening');
                document.getElementById('voice-icon').classList.add('pulse');
            };

            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                document.getElementById('city').value = transcript;
                getWeather();
            };

            recognition.onerror = function(event) {
                console.error('Speech recognition error', event.error);
                document.getElementById('voice-search-btn').classList.remove('listening');
                document.getElementById('voice-icon').classList.remove('pulse');
            };

            recognition.onend = function() {
                document.getElementById('voice-search-btn').classList.remove('listening');
                document.getElementById('voice-icon').classList.remove('pulse');
            };

            recognition.start();
        }

        // Map language codes to speech recognition language codes
        function getRecognitionLanguage(langCode) {
            const langMap = {
                'en': 'en-US',
                'hi': 'hi-IN',
                'te': 'te-IN',
                'ta': 'ta-IN',
                'ml': 'ml-IN',
                'bn': 'bn-IN',
                'gu': 'gu-IN',
                'mr': 'mr-IN',
                'es': 'es-ES',
                'fr': 'fr-FR',
                'de': 'de-DE',
                'zh': 'zh-CN',
                'ja': 'ja-JP',
                'ko': 'ko-KR'
            };

            return langMap[langCode] || 'en-US';
        }

        // Current language variable
        let currentLanguage = 'en';

        function changeLanguage() {
            currentLanguage = document.getElementById('language-select').value;
            updateUILanguage();
            setupVirtualKeyboard();
            // Refresh weather data to update translations
            if (document.getElementById('city').value) {
                getWeather();
            }
        }

        function updateUILanguage() {
            document.getElementById('get-weather-btn').innerText = translations[currentLanguage].getWeather;
            document.getElementById('current-location-btn').innerText = translations[currentLanguage].currentLocation;
            document.getElementById('city').placeholder = translations[currentLanguage].enterCity;
            document.querySelector('#input-card h2').innerText = translations[currentLanguage].appTitle;
            document.querySelector('#hourly-forecast-title').innerText = translations[currentLanguage].hourlyForecast;
            document.getElementById('forecast-title').innerText = translations[currentLanguage].dailyForecast;
            document.getElementById('voice-search-btn').title = translations[currentLanguage].voiceSearch;
        }

        // Setup virtual keyboard based on selected language
        function setupVirtualKeyboard() {
            if (document.getElementById('virtual-keyboard')) {
                document.getElementById('virtual-keyboard').remove();
            }

            // Only show virtual keyboard for non-Latin script languages
            const nonLatinLanguages = ['hi', 'te', 'ta', 'ml', 'bn', 'gu', 'mr', 'zh', 'ja', 'ko'];

            if (nonLatinLanguages.includes(currentLanguage)) {
                createVirtualKeyboard();
            }
        }

        function createVirtualKeyboard() {
            const keyboardLayout = getKeyboardLayout(currentLanguage);

            const keyboardDiv = document.createElement('div');
            keyboardDiv.id = 'virtual-keyboard';
            keyboardDiv.className = 'virtual-keyboard';

            keyboardLayout.forEach(row => {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'keyboard-row';

                row.forEach(key => {
                    const keyButton = document.createElement('button');
                    keyButton.className = 'keyboard-key';
                    keyButton.innerText = key;
                    keyButton.onclick = function() {
                        const cityInput = document.getElementById('city');
                        cityInput.value += key;
                        cityInput.focus();
                    };
                    rowDiv.appendChild(keyButton);
                });

                keyboardDiv.appendChild(rowDiv);
            });

            // Add space and backspace buttons
            const controlRow = document.createElement('div');
            controlRow.className = 'keyboard-row';

            const spaceButton = document.createElement('button');
            spaceButton.className = 'keyboard-key space-key';
            spaceButton.innerText = translations[currentLanguage].space || 'Space';
            spaceButton.onclick = function() {
                const cityInput = document.getElementById('city');
                cityInput.value += ' ';
                cityInput.focus();
            };

            const backspaceButton = document.createElement('button');
            backspaceButton.className = 'keyboard-key backspace-key';
            backspaceButton.innerText = '⌫';
            backspaceButton.onclick = function() {
                const cityInput = document.getElementById('city');
                cityInput.value = cityInput.value.slice(0, -1);
                cityInput.focus();
            };

            controlRow.appendChild(spaceButton);
            controlRow.appendChild(backspaceButton);
            keyboardDiv.appendChild(controlRow);

            // Insert keyboard after input field
            const inputCard = document.getElementById('input-card');
            inputCard.appendChild(keyboardDiv);
        }

        // Get keyboard layout based on language
        function getKeyboardLayout(language) {
            const layouts = {
                hi: [
                    ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ'],
                    ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ'],
                    ['ट', 'ठ', 'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध', 'न'],
                    ['प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श'],
                    ['ष', 'स', 'ह', 'क्ष', 'त्र', 'ज्ञ', 'ं', 'ः', '़', '्']
                ],
                te: [
                    ['అ', 'ఆ', 'ఇ', 'ఈ', 'ఉ', 'ఊ', 'ఋ', 'ౠ', 'ఎ', 'ఏ'],
                    ['క', 'ఖ', 'గ', 'ఘ', 'ఙ', 'చ', 'ఛ', 'జ', 'ఝ', 'ఞ'],
                    ['ట', 'ఠ', 'డ', 'ఢ', 'ణ', 'త', 'థ', 'ద', 'ధ', 'న'],
                    ['ప', 'ఫ', 'బ', 'భ', 'మ', 'య', 'ర', 'ల', 'వ', 'శ'],
                    ['ష', 'స', 'హ', 'ళ', 'క్ష', 'ఱ', 'ం', 'ః', '్', '‌']
                ],
                ta: [
                    ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ'],
                    ['க', 'ங', 'ச', 'ஜ', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ன'],
                    ['ப', 'ம', 'ய', 'ர', 'ற', 'ல', 'ள', 'ழ', 'வ', 'ஶ'],
                    ['ஷ', 'ஸ', 'ஹ', 'ா', 'ி', 'ீ', 'ு', 'ூ', 'ெ', 'ே'],
                    ['ை', 'ொ', 'ோ', 'ௌ', '்', 'ஃ', '௧', '௨', '௩', '௪']
                ],
                ml: [
                    ['അ', 'ആ', 'ഇ', 'ഈ', 'ഉ', 'ഊ', 'ഋ', 'എ', 'ഏ', 'ഐ'],
                    ['ക', 'ഖ', 'ഗ', 'ഘ', 'ങ', 'ച', 'ഛ', 'ജ', 'ഝ', 'ഞ'],
                    ['ട', 'ഠ', 'ഡ', 'ഢ', 'ണ', 'ത', 'ഥ', 'ദ', 'ധ', 'ന'],
                    ['പ', 'ഫ', 'ബ', 'ഭ', 'മ', 'യ', 'ര', 'ല', 'വ', 'ശ'],
                    ['ഷ', 'സ', 'ഹ', 'ള', 'ഴ', 'റ', 'ം', 'ഃ', '്', 'ർ']
                ],
                bn: [
                    ['অ', 'আ', 'ই', 'ঈ', 'উ', 'ঊ', 'ঋ', 'এ', 'ঐ', 'ও'],
                    ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ'],
                    ['ট', 'ঠ', 'ড', 'ঢ', 'ণ', 'ত', 'থ', 'দ', 'ধ', 'ন'],
                    ['প', 'ফ', 'ব', 'ভ', 'ম', 'য', 'র', 'ল', 'শ', 'ষ'],
                    ['স', 'হ', 'ড়', 'ঢ়', 'য়', 'ৎ', 'ং', 'ঃ', 'ঁ', '্']
                ],
                default: [
                    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
                    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
                    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
                ]
            };

            return layouts[language] || layouts.default;
        }

        // Initialize the app
        document.addEventListener('DOMContentLoaded', function() {
            currentLanguage = document.getElementById('language-select').value;
            updateUILanguage();
        });