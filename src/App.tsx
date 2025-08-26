import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { db, auth } from "./firebase";
import { collection, addDoc, getDocs, onSnapshot, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider, User, signOut } from "firebase/auth";

// إصلاح أيقونات Leaflet الافتراضية
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Note {
  id: string;
  lat: number;
  lng: number;
  emoji: string;
  text: string;
  user: string;
  userId: string;
  color: string;
  createdAt: any;
}

// تعريف نوع للتحكم في المواقع لإصلاح خطأ TypeScript
declare module "leaflet" {
  namespace control {
    function locate(options: any): any;
  }
}

// ترجمات التطبيق
const translations = {
  ar: {
    title: "🗺️ خريطة الملاحظات",
    loginMessage: "سجل الدخول لإضافة ملاحظات على الخريطة",
    loginButton: "تسجيل الدخول باستخدام Google",
    welcome: "مرحباً",
    addNote: "إضافة ملاحظة جديدة",
    notePlaceholder: "اكتب ملاحظتك هنا...",
    emojiLabel: "الإيموجي",
    colorLabel: "اللون",
    preview: "هذه هي الطريقة التي ستبدو بها ملاحظتك",
    addNoteButton: "انقر على الخريطة لإضافة الملاحظة",
    recentNotes: "الملاحظات الأخيرة",
    noNotes: "لا توجد ملاحظات حتى الآن. كن أول من يضيف ملاحظة!",
    loading: "جاري تحميل الملاحظات...",
    additionalNotes: "ملاحظة إضافية",
    additionalNotesCount: "عرض %count% ملاحظة إضافية",
    contact: "التواصل",
    help: "المساعدة",
    developer: "مطور التطبيق: meknaci abdelkader",
    contactTitle: "تواصل معنا",
    helpTitle: "مركز المساعدة",
    contactText: "يسعدنا تواصلك معنا لأي استفسارات أو اقتراحات",
    helpText: "كيفية استخدام التطبيق: 1. سجل الدخول 2. اكتب ملاحظتك 3. اختر لوناً وإيموجي 4. انقر على الخريطة لوضع الملاحظة",
    email: "البريد الإلكتروني",
    message: "الرسالة",
    send: "إرسال",
    name: "الاسم",
    contactSuccess: "تم إرسال رسالتك بنجاح!",
    logout: "تسجيل الخروج",
    delete: "حذف",
    confirmDelete: "هل أنت متأكد من أنك تريد حذف هذه الملاحظة؟",
    locate: "عرض موقعي الحالي",
    messageSent: "تم إرسال الرسالة بنجاح إلى meknaciabdelkader2@gmail.com",
    sending: "جاري الإرسال...",
    subject: "الموضوع",
    messagePlaceholder: "اكتب رسالتك هنا...",
    contactInfo: "معلومات التواصل",
    directEmail: "أو可以直接发送邮件至: meknaciabdelkader2@gmail.com",
    phone: "الهاتف",
    socialMedia: "وسائل التواصل الاجتماعي",
    copyEmail: "نسخ البريد الإلكتروني",
    emailCopied: "تم نسخ البريد الإلكتروني"
  },
  en: {
    title: "🗺️ Notes Map",
    loginMessage: "Login to add notes on the map",
    loginButton: "Login with Google",
    welcome: "Welcome",
    addNote: "Add a new note",
    notePlaceholder: "Write your note here...",
    emojiLabel: "Emoji",
    colorLabel: "Color",
    preview: "This is how your note will look",
    addNoteButton: "Click on the map to add the note",
    recentNotes: "Recent Notes",
    noNotes: "No notes yet. Be the first to add a note!",
    loading: "Loading notes...",
    additionalNotes: "additional note",
    additionalNotesCount: "View %count% more notes",
    contact: "Contact",
    help: "Help",
    developer: "Developer: meknaci abdelkader",
    contactTitle: "Contact Us",
    helpTitle: "Help Center",
    contactText: "We are happy to hear from you for any inquiries or suggestions",
    helpText: "How to use the app: 1. Login 2. Write your note 3. Choose a color and emoji 4. Click on the map to place the note",
    email: "Email",
    message: "Message",
    send: "Send",
    name: "Name",
    contactSuccess: "Your message has been sent successfully!",
    logout: "Logout",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this note?",
    locate: "Show my current location",
    messageSent: "Message sent successfully to meknaciabdelkader2@gmail.com",
    sending: "Sending...",
    subject: "Subject",
    messagePlaceholder: "Write your message here...",
    contactInfo: "Contact Information",
    directEmail: "Or send directly to: meknaciabdelkader2@gmail.com",
    phone: "Phone",
    socialMedia: "Social Media",
    copyEmail: "Copy Email",
    emailCopied: "Email copied"
  },
  fr: {
    title: "🗺️ Carte de Notes",
    loginMessage: "Connectez-vous pour ajouter des notes sur la carte",
    loginButton: "Se connecter avec Google",
    welcome: "Bienvenue",
    addNote: "Ajouter une nouvelle note",
    notePlaceholder: "Écrivez votre note ici...",
    emojiLabel: "Emoji",
    colorLabel: "Couleur",
    preview: "Voici à quoi ressemblera votre note",
    addNoteButton: "Cliquez sur la carte pour ajouter la note",
    recentNotes: "Notes Récentes",
    noNotes: "Aucune note pour le moment. Soyez le premier à ajouter une note!",
    loading: "Chargement des notes...",
    additionalNotes: "note supplémentaire",
    additionalNotesCount: "Voir %count% notes supplémentaires",
    contact: "Contact",
    help: "Aide",
    developer: "Développeur: meknaci abdelkader",
    contactTitle: "Contactez-nous",
    helpTitle: "Centre d'aide",
    contactText: "Nous sommes heureux de vous entendre pour toute question ou suggestion",
    helpText: "Comment utiliser l'application: 1. Connectez-vous 2. Écrivez votre note 3. Choisissez une couleur et un emoji 4. Cliquez sur la carte pour placer la note",
    email: "E-mail",
    message: "Message",
    send: "Envoyer",
    name: "Nom",
    contactSuccess: "Votre message a été envoyé avec succès!",
    logout: "Déconnexion",
    delete: "Supprimer",
    confirmDelete: "Êtes-vous sûr de vouloir supprimer cette note?",
    locate: "Afficher ma position actuelle",
    messageSent: "Message envoyé avec succès à meknaciabdelkader2@gmail.com",
    sending: "Envoi en cours...",
    subject: "Sujet",
    messagePlaceholder: "Écrivez votre message ici...",
    contactInfo: "Informations de contact",
    directEmail: "Ou envoyez directement à: meknaciabdelkader2@gmail.com",
    phone: "Téléphone",
    socialMedia: "Médias sociaux",
    copyEmail: "Copier l'email",
    emailCopied: "Email copié"
  }
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [emoji, setEmoji] = useState("📝");
  const [color, setColor] = useState("#ffeb3b");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [language, setLanguage] = useState<"ar" | "en" | "fr">("ar");
  const [activeTab, setActiveTab] = useState<"notes" | "contact" | "help">("notes");
  const [contactForm, setContactForm] = useState({ 
    name: "", 
    email: "", 
    subject: "", 
    message: "" 
  });
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "success" | "error">("idle");
  const [emailCopied, setEmailCopied] = useState(false);

  const t = translations[language];

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error) {
      console.error(error);
      alert(language === "ar" ? "فشل في تسجيل الدخول. حاول مرة أخرى." : 
            language === "fr" ? "Échec de la connexion. Veuillez réessayer." :
            "Login failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setText("");
      setSelectedNote(null);
    } catch (error) {
      console.error(error);
      alert(language === "ar" ? "فشل في تسجيل الخروج. حاول مرة أخرى." : 
            language === "fr" ? "Échec de la déconnexion. Veuillez réessayer." :
            "Logout failed. Please try again.");
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!leafletMapRef.current && mapRef.current) {
      leafletMapRef.current = L.map(mapRef.current).setView([24.7136, 46.6753], 10);
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(leafletMapRef.current);

      // إضافة زر لتحديد الموقع (مع التعامل مع الخطأ)
      try {
        if (L.control.locate) {
          L.control.locate({
            position: 'bottomright',
            strings: {
              title: t.locate
            }
          }).addTo(leafletMapRef.current);
        }
      } catch (error) {
        console.warn("لم يتم تحميل إضافة المواقع، سيتم استخدام الزر الافتراضي");
        addDefaultLocateButton();
      }
    }
  }, [language]);

  // دالة لإضافة زر تحديد الموقع الافتراضي إذا لم تكن الإضافة متاحة
  const addDefaultLocateButton = () => {
    if (!leafletMapRef.current) return;
    
    const LocateControl = L.Control.extend({
      onAdd: function(map: L.Map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', 'leaflet-bar-part', container);
        button.innerHTML = '📍';
        button.href = '#';
        button.title = t.locate;
        
        L.DomEvent.on(button, 'click', function(e) {
          L.DomEvent.stopPropagation(e);
          L.DomEvent.preventDefault(e);
          locateUser();
        });
        
        return container;
      }
    });
    
    new LocateControl({ position: 'bottomright' }).addTo(leafletMapRef.current);
  };

  const locateUser = () => {
    if (!leafletMapRef.current) return;
    
    if (!navigator.geolocation) {
      alert(language === "ar" ? "متصفحك لا يدعم خدمة تحديد الموقع" : 
            language === "fr" ? "Votre navigateur ne prend pas en charge la géolocalisation" :
            "Your browser does not support geolocation");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        leafletMapRef.current?.setView([latitude, longitude], 15);
        
        // إضافة علامة على الموقع الحالي
        L.marker([latitude, longitude])
          .addTo(leafletMapRef.current!)
          .bindPopup(language === "ar" ? "أنت هنا" : 
                    language === "fr" ? "Vous êtes ici" :
                    "You are here")
          .openPopup();
      },
      (error) => {
        alert((language === "ar" ? "تعذر الحصول على موقعك: " : 
              language === "fr" ? "Impossible d'obtenir votre position: " :
              "Unable to get your location: ") + error.message);
      }
    );
  };

  useEffect(() => {
    // الاشتراك في التحديثات الفورية من Firebase
    const unsubscribe = onSnapshot(collection(db, "notes"), (snapshot) => {
      const notesData: Note[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as Note));
      
      // ترتيب الملاحظات من الأحدث إلى الأقدم
      notesData.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
        }
        return 0;
      });
      
      setNotes(notesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching notes:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderNotes = () => {
    if (!leafletMapRef.current) return;

    // إزالة العلامات السابقة
    markersRef.current.forEach(marker => {
      leafletMapRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // إضافة علامات جديدة
    notes.forEach((note) => {
      const iconHtml = `
        <div style="
          background:${note.color};
          border-radius:50%;
          width:40px;
          height:40px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:20px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          border: 2px solid white;
        ">
          ${note.emoji}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -45],
      });

      const marker = L.marker([note.lat, note.lng], { icon: customIcon }).addTo(
        leafletMapRef.current!
      );

      marker.bindPopup(
        `<div style="background:${note.color}; padding:10px; border-radius:8px; max-width:250px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="font-size: 20px;">${note.emoji}</div>
            <strong>${note.user}</strong>
          </div>
          <p style="margin: 0;">${note.text}</p>
          ${user && user.uid === note.userId ? `
            <div style="margin-top: 10px; display: flex; gap: 5px;">
              <button onclick="window.deleteNote('${note.id}')" style="background: #ff4757; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">${t.delete}</button>
            </div>
          ` : ''}
        </div>`
      );

      marker.on('popupopen', () => {
        setSelectedNote(note);
      });

      marker.on('popupclose', () => {
        setSelectedNote(null);
      });

      markersRef.current.push(marker);
    });

    // تعريف الدوال العالمية للاستخدام في البوب آب
    (window as any).deleteNote = async (noteId: string) => {
      if (window.confirm(t.confirmDelete)) {
        try {
          await deleteDoc(doc(db, "notes", noteId));
        } catch (error) {
          console.error("Error deleting note:", error);
          alert(language === "ar" ? "فشل في حذف الملاحظة" : 
                language === "fr" ? "Échec de la suppression de la note" :
                "Failed to delete note");
        }
      }
    };
  };

  useEffect(() => {
    renderNotes();
  }, [notes, user, language]);

  useEffect(() => {
    if (!leafletMapRef.current) return;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      if (!user) {
        alert(language === "ar" ? "يجب تسجيل الدخول أولاً!" : 
              language === "fr" ? "Vous devez d'abord vous connecter!" :
              "You must login first!");
        return;
      }
      if (!text.trim()) {
        alert(language === "ar" ? "يجب إدخال ملاحظة أولاً!" : 
              language === "fr" ? "Vous devez d'abord saisir une note!" :
              "You must enter a note first!");
        return;
      }

      const newNote = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        emoji,
        text: text.trim(),
        user: user.displayName || (language === "ar" ? "مستخدم" : 
              language === "fr" ? "Utilisateur" :
              "User"),
        userId: user.uid,
        color,
        createdAt: new Date()
      };

      try {
        await addDoc(collection(db, "notes"), newNote);
        setText("");
        setEmoji("📝");
      } catch (error) {
        console.error(error);
        alert(language === "ar" ? "فشل في إضافة الملاحظة. حاول مرة أخرى." : 
              language === "fr" ? "Échec de l'ajout de la note. Veuillez réessayer." :
              "Failed to add note. Please try again.");
      }
    };

    leafletMapRef.current.on("click", handleMapClick);
    return () => {
      leafletMapRef.current?.off("click", handleMapClick);
    };
  }, [user, text, emoji, color, language]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    
    if (language === "ar") {
      return new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } else if (language === "fr") {
      return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } else {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setSendStatus("idle");
    
    try {
      // حفظ الرسالة في Firebase
      await addDoc(collection(db, "messages"), {
        ...contactForm,
        createdAt: serverTimestamp(),
        language: language,
        to: "meknaciabdelkader2@gmail.com"
      });
      
      setSendStatus("success");
      setContactForm({ name: "", email: "", subject: "", message: "" });
      
      // إعادة تعيين حالة النجاح بعد 5 ثوان
      setTimeout(() => setSendStatus("idle"), 5000);
    } catch (error) {
      console.error("Error sending message:", error);
      setSendStatus("error");
    } finally {
      setIsSending(false);
    }
  };

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText("meknaciabdelkader2@gmail.com")
      .then(() => {
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  const renderContent = () => {
    if (activeTab === "contact") {
      return (
        <div>
          <h3 style={{ marginTop: "0", marginBottom: "15px" }}>{t.contactTitle}</h3>
          <p style={{ marginBottom: "15px" }}>{t.contactText}</p>
          
          <div style={{ 
            background: "rgba(255,255,255,0.05)", 
            padding: "15px", 
            borderRadius: "8px", 
            marginBottom: "15px" 
          }}>
            <h4 style={{ marginTop: "0", marginBottom: "10px" }}>{t.contactInfo}</h4>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "5px 0" }}>
              <span style={{ fontSize: "14px" }}>
                <strong>Email:</strong> meknaciabdelkader2@gmail.com
              </span>
              <button
                onClick={copyEmailToClipboard}
                style={{
                  padding: "5px 10px",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "4px",
                  color: "#ecf0f1",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                {t.copyEmail}
              </button>
            </div>
            {emailCopied && (
              <div style={{ 
                padding: "5px", 
                background: "#27ae60", 
                color: "white", 
                borderRadius: "4px", 
                marginTop: "5px",
                textAlign: "center",
                fontSize: "12px"
              }}>
                {t.emailCopied}
              </div>
            )}
            <p style={{ margin: "5px 0", fontSize: "14px" }}>
              <strong>{t.phone}:</strong> +213 123 456 789
            </p>
            <p style={{ margin: "5px 0", fontSize: "14px" }}>
              <strong>{t.socialMedia}:</strong> insta: a.t.a.7mv9
            </p>
          </div>
          
          <form onSubmit={handleContactSubmit}>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>{t.name}:</label>
              <input
                type="text"
                value={contactForm.name}
                onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  borderRadius: "8px", 
                  border: "1px solid #34495e", 
                  background: "#2c3e50",
                  color: "#ecf0f1"
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>{t.email}:</label>
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  borderRadius: "8px", 
                  border: "1px solid #34495e", 
                  background: "#2c3e50",
                  color: "#ecf0f1"
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>{t.subject}:</label>
              <input
                type="text"
                value={contactForm.subject}
                onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  borderRadius: "8px", 
                  border: "1px solid #34495e", 
                  background: "#2c3e50",
                  color: "#ecf0f1"
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>{t.message}:</label>
              <textarea
                value={contactForm.message}
                onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                placeholder={t.messagePlaceholder}
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  borderRadius: "8px", 
                  border: "1px solid #34495e", 
                  background: "#2c3e50",
                  color: "#ecf0f1",
                  minHeight: "120px",
                  resize: "vertical"
                }}
                required
              />
            </div>
            
            {sendStatus === "success" && (
              <div style={{ 
                padding: "10px", 
                background: "#27ae60", 
                color: "white", 
                borderRadius: "5px", 
                marginBottom: "15px",
                textAlign: "center"
              }}>
                {t.messageSent}
              </div>
            )}
            
            {sendStatus === "error" && (
              <div style={{ 
                padding: "10px", 
                background: "#e74c3c", 
                color: "white", 
                borderRadius: "5px", 
                marginBottom: "15px",
                textAlign: "center"
              }}>
                {language === "ar" ? "فشل في إرسال الرسالة. حاول مرة أخرى." : 
                 language === "fr" ? "Échec de l'envoi du message. Veuillez réessayer." :
                 "Failed to send message. Please try again."}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSending}
              style={{
                width: "100%",
                padding: "12px",
                background: isSending ? "#95a5a6" : "#3498db",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                cursor: isSending ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "bold"
              }}
            >
              {isSending ? t.sending : t.send}
            </button>
          </form>
          
          <div style={{ 
            marginTop: "20px", 
            padding: "15px", 
            background: "rgba(52, 152, 219, 0.1)", 
            borderRadius: "8px",
            border: "1px solid rgba(52, 152, 219, 0.3)"
          }}>
            <p style={{ margin: "0", fontSize: "14px", textAlign: "center" }}>
              {t.directEmail}
            </p>
          </div>
        </div>
      );
    } else if (activeTab === "help") {
      return (
        <div>
          <h3 style={{ marginTop: "0", marginBottom: "15px" }}>{t.helpTitle}</h3>
          <div style={{ lineHeight: "1.6", marginBottom: "20px" }}>
            <p>{t.helpText}</p>
            <ol style={{ paddingLeft: "20px" }}>
              <li>{language === "ar" ? "سجل الدخول باستخدام حساب Google" : 
                   language === "fr" ? "Connectez-vous avec votre compte Google" :
                   "Login with your Google account"}</li>
              <li>{language === "ar" ? "اكتب ملاحظتك في حقل النص" : 
                   language === "fr" ? "Écrivez votre note dans le champ de texte" :
                   "Write your note in the text field"}</li>
              <li>{language === "ar" ? "اختر لوناً وإيموجي لملاحظتك" : 
                   language === "fr" ? "Choisissez une couleur et un emoji pour votre note" :
                   "Choose a color and emoji for your note"}</li>
              <li>{language === "ar" ? "انقر على الخريطة في المكان الذي تريد إضافة الملاحظة فيه" : 
                   language === "fr" ? "Cliquez sur la carte à l'endroit où vous voulez ajouter la note" :
                   "Click on the map where you want to add the note"}</li>
            </ol>
          </div>
          <div style={{ marginTop: "20px", paddingTop: "15px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <h4 style={{ marginTop: "0", marginBottom: "10px" }}>{t.developer}</h4>
            <p style={{ margin: "5px 0", fontSize: "14px" }}>
              <strong>Email:</strong> meknaciabdelkader2@gmail.com
            </p>
              
            
          </div>
        </div>
      );
    } else {
      return (
        <>
          {!user ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "40px" }}>
              <p style={{ textAlign: "center", marginBottom: "20px" }}>{t.loginMessage}</p>
              <button
                onClick={handleLogin}
                style={{
                  padding: "12px 20px",
                  background: "#3498db",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
              >
                <span>{t.loginButton}</span>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <img 
                    src={user.photoURL || undefined} 
                    alt="User" 
                    style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                  />
                  <div>
                    <div style={{ fontWeight: "bold" }}>{user.displayName}</div>
                    <div style={{ fontSize: "12px", opacity: "0.8" }}>{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: "6px 12px",
                    background: "transparent",
                    border: "1px solid #e74c3c",
                    borderRadius: "5px",
                    color: "#e74c3c",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  {t.logout}
                </button>
              </div>

              <div style={{ background: "rgba(255,255,255,0.1)", padding: "15px", borderRadius: "10px" }}>
                <h3 style={{ marginTop: "0", marginBottom: "15px" }}>{t.addNote}</h3>
                
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>{t.notePlaceholder}:</label>
                  <textarea
                    placeholder={t.notePlaceholder}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    style={{ 
                      width: "100%", 
                      padding: "10px", 
                      borderRadius: "8px", 
                      border: "1px solid #34495e", 
                      background: "#2c3e50",
                      color: "#ecf0f1",
                      minHeight: "80px",
                      resize: "vertical"
                    }}
                  />
                </div>
                
                <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>{t.emojiLabel}:</label>
                    <select
                      value={emoji}
                      onChange={(e) => setEmoji(e.target.value)}
                      style={{ 
                        width: "100%", 
                        padding: "8px", 
                        borderRadius: "8px", 
                        border: "1px solid #34495e", 
                        background: "#2c3e50",
                        color: "#ecf0f1"
                      }}
                    >
                      <option value="📝">📝 {language === "ar" ? "ملاحظة" : language === "fr" ? "Note" : "Note"}</option>
                      <option value="😀">😀 {language === "ar" ? "سعيد" : language === "fr" ? "Heureux" : "Happy"}</option>
                      <option value="😢">😢 {language === "ar" ? "حزين" : language === "fr" ? "Triste" : "Sad"}</option>
                      <option value="❤️">❤️ {language === "ar" ? "إعجاب" : language === "fr" ? "Amour" : "Love"}</option>
                      <option value="🎉">🎉 {language === "ar" ? "احتفال" : language === "fr" ? "Célébration" : "Celebration"}</option>
                    </select>
                  </div>
                  
                  <div style={{ width: "60px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>{t.colorLabel}:</label>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      style={{ 
                        width: "100%", 
                        height: "38px", 
                        border: "1px solid #34495e", 
                        borderRadius: "8px", 
                        cursor: "pointer",
                        background: "transparent"
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ 
                  padding: "5px 10px", 
                  background: color, 
                  color: "#2c3e50", 
                  borderRadius: "8px", 
                  marginBottom: "15px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: "bold"
                }}>
                  <span>{emoji}</span>
                  <span>{t.preview}</span>
                </div>
                
                <button
                  disabled={!text.trim()}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: text.trim() ? "#27ae60" : "#95a5a6",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    cursor: text.trim() ? "pointer" : "not-allowed",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  {t.addNoteButton}
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: "20px" }}>
            <h3 style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>
              {t.recentNotes} ({notes.length})
            </h3>
            
            {isLoading ? (
              <div style={{ textAlign: "center", padding: "20px" }}>{t.loading}</div>
            ) : notes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", opacity: "0.7" }}>
                {t.noNotes}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                {notes.slice(0, 5).map((note) => (
                  <div 
                    key={note.id} 
                    style={{ 
                      background: "rgba(255,255,255,0.05)", 
                      padding: "10px", 
                      borderRadius: "8px",
                      borderLeft: `3px solid ${note.color}`,
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      if (leafletMapRef.current) {
                        leafletMapRef.current.setView([note.lat, note.lng], 15);
                      }
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                      <div style={{ fontSize: "18px" }}>{note.emoji}</div>
                      <div style={{ fontWeight: "bold", fontSize: "14px" }}>{note.user}</div>
                    </div>
                    <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.4" }}>{note.text}</p>
                    <div style={{ fontSize: "11px", opacity: "0.7", marginTop: "5px" }}>
                      {formatDate(note.createdAt)}
                    </div>
                  </div>
                ))}
                
                {notes.length > 5 && (
                  <div style={{ textAlign: "center", marginTop: "10px", fontSize: "14px", opacity: "0.7" }}>
                    {t.additionalNotesCount.replace("%count%", (notes.length - 5).toString())}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      );
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <div
        style={{
          width: "320px",
          padding: "20px",
          background: "linear-gradient(135deg, #2c3e50 0%, #1a2530 100%)",
          color: "#ecf0f1",
          display: "flex",
          flexDirection: "column",
          boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h1 style={{ margin: "0", color: "#fff", fontSize: "24px" }}>
            {t.title}
          </h1>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "ar" | "en" | "fr")}
            style={{
              padding: "5px 10px",
              borderRadius: "5px",
              border: "1px solid #34495e",
              background: "#2c3e50",
              color: "#ecf0f1",
              cursor: "pointer"
            }}
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>
        
        <div style={{ display: "flex", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={() => setActiveTab("notes")}
            style={{
              padding: "10px 15px",
              background: activeTab === "notes" ? "rgba(255,255,255,0.1)" : "transparent",
              border: "none",
              color: "#ecf0f1",
              cursor: "pointer",
              fontWeight: activeTab === "notes" ? "bold" : "normal",
              borderBottom: activeTab === "notes" ? "2px solid #3498db" : "none"
            }}
          >
            {t.title}
          </button>
          <button
            onClick={() => setActiveTab("contact")}
            style={{
              padding: "10px 15px",
              background: activeTab === "contact" ? "rgba(255,255,255,0.1)" : "transparent",
              border: "none",
              color: "#ecf0f1",
              cursor: "pointer",
              fontWeight: activeTab === "contact" ? "bold" : "normal",
              borderBottom: activeTab === "contact" ? "2px solid #3498db" : "none"
            }}
          >
            {t.contact}
          </button>
          <button
            onClick={() => setActiveTab("help")}
            style={{
              padding: "10px 15px",
              background: activeTab === "help" ? "rgba(255,255,255,0.1)" : "transparent",
              border: "none",
              color: "#ecf0f1",
              cursor: "pointer",
              fontWeight: activeTab === "help" ? "bold" : "normal",
              borderBottom: activeTab === "help" ? "2px solid #3498db" : "none"
            }}
          >
            {t.help}
          </button>
        </div>
        
        {renderContent()}
        
        <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "12px", opacity: "0.7" }}>
          {t.developer}
        </div>
      </div>
      
      <div 
        ref={mapRef} 
        style={{ 
          flex: 1,
          position: "relative"
        }} 
      />
      
      {selectedNote && (
        <div style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          background: "white",
          padding: "15px",
          borderRadius: "10px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          maxWidth: "300px",
          zIndex: 1000
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div style={{ 
              background: selectedNote.color, 
              borderRadius: "50%", 
              width: "40px", 
              height: "40px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              fontSize: "20px"
            }}>
              {selectedNote.emoji}
            </div>
            <div>
              <div style={{ fontWeight: "bold" }}>{selectedNote.user}</div>
              <div style={{ fontSize: "12px", color: "#7f8c8d" }}>{formatDate(selectedNote.createdAt)}</div>
            </div>
          </div>
          <p style={{ margin: "0", lineHeight: "1.5" }}>{selectedNote.text}</p>
          <button 
            onClick={() => setSelectedNote(null)}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "transparent",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              color: "#7f8c8d"
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default App;