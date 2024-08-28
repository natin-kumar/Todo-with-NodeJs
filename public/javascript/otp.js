document.getElementById('verifyOtpBtn').addEventListener('click', function () {
    const otp = document.getElementById('otp').value;

    fetch('/verifyOTP', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp: otp })
    })
    .then((res) => {
        if (!res.ok) {
            throw new Error("Error: " + res.statusText);
        }
        return res.json();
    })
    .then(data => {
        const statusMessage = document.querySelector('#statusMessage');
        if (data.message === "OTP not matched!") {
            statusMessage.innerHTML = data.message;
            setTimeout(() => {
                statusMessage.innerHTML = "";
            }, 3000);
            return;
        }
        if (data.message === "User already exists."||data.message=="User registered successfully.") {
            window.location.href = "/loginUser";
        }
       

    })
    .catch(err => {
        console.error("Error in verification: ", err);
    });
});

const verify = document.getElementById('verifyOtpBtn');
const resend = document.getElementById('resendOtp');
let i = 30;

function updateTimer() {
    resend.disabled = true;
    resend.style.backgroundColor = "grey";
    // verify.disabled = true;
    document.querySelector('.time').innerText = `You can resend OTP after ${i} seconds.`;
    
    const interval = setInterval(() => {
        i--;
        document.querySelector('.time').innerText = `You can resend OTP after ${i} seconds.`;
        if (i <= 0) {
            clearInterval(interval);
            resend.disabled = false;
            resend.style.backgroundColor = "green";
            verify.disabled = false;
            document.querySelector('.time').innerText = "";
        }
    }, 1000);
}

updateTimer();

resend.addEventListener('click', () => {
    fetch('/resend', {
        method: 'GET'
    })
    .then(res => {
        if (!res.ok) {
            throw new Error("Error: " + res.statusText);
        }
        return res.json();
    })
    .then(data => {
        console.log(data);
        const statusMessage = document.querySelector('#statusMessage');
        if (data.message === "Otp resent Successfully") {
            statusMessage.innerHTML = "OTP resent successfully.";
            i = 30;  // Reset timer
            updateTimer();  // Start new timer
        } else {
            statusMessage.innerHTML = "Failed to resend OTP.";
        }
        setTimeout(() => {
            statusMessage.innerHTML = "";
        }, 3000);
    })
    .catch(err => {
        console.error("Error in resending OTP: ", err);
    });
});
