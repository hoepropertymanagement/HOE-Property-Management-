
const VERIFY_URL = "https://script.google.com/macros/s/AKfycbxH4u7RFVwn2fBFHiUzUyhQr2jISdGUBjxQ3hIb8j7TRkl20bLo4Pfpy6EkuZnrgXHM/exec";

export async function sendVerificationEmail(userEmail: string) {
    try {
        await fetch(VERIFY_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `email=${encodeURIComponent(userEmail)}`
        });
        return { success: true };
    } catch (error) {
        console.error("Error sending verification email:", error);
        return { success: false, error };
    }
}
