
/* =====================================
   ECONEXA — SMART ENERGY INTELLIGENCE
   ===================================== */


/* 1. WHAT-IF ENERGY SIMULATOR */

const usageSlider = document.getElementById('usage');
const usageValue = document.getElementById('usageValue');
const tariffInput = document.getElementById('tariff');
const billValue = document.getElementById('billValue');
const savingValue = document.getElementById('savingValue');
const simulatorMessage = document.getElementById('simulatorMessage');

function updateSimulator() {
    if (
        !usageSlider ||
        !usageValue ||
        !tariffInput ||
        !billValue ||
        !savingValue ||
        !simulatorMessage
    ) {
        console.warn('Some energy simulator HTML elements were not found.');
        return;
    }

    const usage = Number(usageSlider.value);
    const enteredTariff = Number(tariffInput.value);
    const tariff = Math.max(
        0,
        Math.min(100, Number.isFinite(enteredTariff) ? enteredTariff : 0)
    );

    usageValue.textContent = usage;

    const monthlyBill = usage * tariff;
    const potentialSavings = monthlyBill * 0.15;

    billValue.textContent = monthlyBill.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    savingValue.textContent = potentialSavings.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    if (usage <= 150) {
        simulatorMessage.textContent =
            'Your sample usage is relatively low. Keep monitoring to find more opportunities.';
    } else if (usage <= 350) {
        simulatorMessage.textContent =
            'Try efficient appliances and switching off unused devices to explore possible savings.';
    } else {
        simulatorMessage.textContent =
            'Higher sample usage gives you more reason to investigate energy-intensive appliances.';
    }
}

if (usageSlider && tariffInput) {
    usageSlider.addEventListener('input', updateSimulator);
    tariffInput.addEventListener('input', updateSimulator);
    updateSimulator();
}


/* 2. ENERGY WASTE DETECTIVE */

const insightButtons = document.querySelectorAll('.recommendation-button');

insightButtons.forEach(button => {
    button.addEventListener('click', () => {
        const insightType = button.dataset.insight;
        const details = document.getElementById(`${insightType}Details`);

        if (!details) {
            console.warn(`Recommendation details not found for: ${insightType}`);
            return;
        }

        const isOpening = details.hidden;
        details.hidden = !isOpening;

        button.textContent = isOpening
            ? 'Hide recommendations ↑'
            : 'View recommendations ↗';
    });
});


/* 3. BACKEND STATUS */

async function checkBackendStatus() {
    try {
        const response = await fetch('/api/status');

        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        console.log('EcoNexa backend:', data.message || data);
    } catch (error) {
        console.error(
            'Could not connect to the EcoNexa backend:',
            error.message
        );
    }
}


/* 4. LOAD ENERGY READINGS FROM SQLITE */

async function loadEnergyReadings() {
    try {
        const response = await fetch('/api/energy-readings');

        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        const readings = data.readings;

        if (!readings) {
            throw new Error('No energy readings were returned by the server.');
        }

        function updateText(id, value) {
            const element = document.getElementById(id);

            if (element) {
                element.textContent = value;
            }
        }

        // Electricity usage
        if (Number.isFinite(readings.electricityUsageKwh)) {
            updateText(
                'electricityUsageValue',
                readings.electricityUsageKwh.toFixed(1)
            );
        }

        // Estimated electricity bill
        if (Number.isFinite(readings.estimatedBillRupees)) {
            updateText(
                'estimatedBillValue',
                readings.estimatedBillRupees.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })
            );
        }

        // Solar generation
        if (Number.isFinite(readings.solarGenerationKwh)) {
            updateText(
                'solarGenerationValue',
                readings.solarGenerationKwh.toFixed(1)
            );
        }

        // Carbon emissions
        if (Number.isFinite(readings.carbonEmissionsKg)) {
            const carbon = readings.carbonEmissionsKg.toFixed(1);

            updateText('dashboardCarbonValue', carbon);
            updateText('carbonValue', carbon);
        }

        console.log(
            `EcoNexa readings loaded. Data type: ${data.dataType}. Live hardware: ${data.isLive}.`
        );
        console.log(data.message || 'Energy readings loaded successfully.');

    } catch (error) {
        console.error(
            'Could not load EcoNexa energy readings:',
            error.message
        );
    }
}


/* 5. START AND REFRESH */

checkBackendStatus();
loadEnergyReadings();

// Refresh dashboard readings every 10 seconds
setInterval(loadEnergyReadings, 10000);
