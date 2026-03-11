import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, onSnapshot } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { 
  apiKey: "AIzaSyBSCGwRzGkfyYREBk9R9etbNWgghd2NRmU",
  authDomain: "uber-entrega-bc28f.firebaseapp.com",
  projectId: "uber-entrega-bc28f",
  storageBucket: "uber-entrega-bc28f.firebasestorage.app",
  messagingSenderId: "59703521556",
  appId: "1:59703521556:web:703a1a3534c494957c5201",};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentUser = JSON.parse(localStorage.getItem('user_motoboy'));

window.showScreen = (screenId) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
};

// Funções de Auth (Simplificado)
window.login = async () => {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    const docSnap = await getDoc(doc(db, "usuarios", email));
    if (docSnap.exists() && docSnap.data().senha === senha) {
        localStorage.setItem('user_motoboy', JSON.stringify(docSnap.data()));
        location.reload();
    }
};

window.register = async () => {
    const user = { 
        nome: document.getElementById('reg-nome').value, 
        email: document.getElementById('reg-email').value,
        senha: document.getElementById('reg-senha').value,
        tel: document.getElementById('reg-tel').value,
        tipo: 'motoboy' 
    };
    await setDoc(doc(db, "usuarios", user.email), user);
    localStorage.setItem('user_motoboy', JSON.stringify(user));
    location.reload();
};

window.logout = () => { localStorage.removeItem('user_motoboy'); location.reload(); };

// Lógica de Entregas
if(currentUser) {
    showScreen('screen-home');
    
    // Escutar pedidos disponíveis (Status: procurando)
    const q = query(collection(db, "pedidos"), where("status", "in", ["procurando", "aceito", "em entrega"]));
    onSnapshot(q, (snapshot) => {
        const lista = document.getElementById('lista-pedidos');
        const activeArea = document.getElementById('active-delivery');
        lista.innerHTML = "";
        activeArea.innerHTML = "";
        activeArea.classList.add('hidden');

        snapshot.forEach((d) => {
            const p = d.data();
            const id = d.id;

            // Se o motoboy já aceitou este pedido
            if(p.motoboyEmail === currentUser.email && p.status !== 'finalizado') {
                activeArea.classList.remove('hidden');
                activeArea.innerHTML = `
                    <div class="card-order" style="border: 2px solid var(--primary)">
                        <h4>ENTREGA ATUAL</h4>
                        <p><b>De:</b> ${p.coleta}</p>
                        <p><b>Para:</b> ${p.entrega}</p>
                        <p><b>Cliente:</b> ${p.clienteNome}</p>
                        <br>
                        ${p.status === 'aceito' ? 
                            `<button onclick="updateStatus('${id}', 'em entrega')" class="btn-main">Iniciar Entrega</button>` : 
                            `<button onclick="updateStatus('${id}', 'finalizado')" class="btn-main" style="background:#27ae60">Finalizar</button>`
                        }
                    </div>
                `;
            } 
            // Se o pedido está livre
            else if(p.status === 'procurando') {
                lista.innerHTML += `
                    <div class="card-order">
                        <p><b>Coleta:</b> ${p.coleta}</p>
                        <p><b>Entrega:</b> ${p.entrega}</p>
                        <p><b>Valor:</b> ${p.valor}</p>
                        <button onclick="aceitarPedido('${id}')" class="btn-main">Aceitar</button>
                    </div>
                `;
            }
        });
    });
} else {
    showScreen('screen-login');
}

window.aceitarPedido = async (id) => {
    await updateDoc(doc(db, "pedidos", id), {
        status: 'aceito',
        motoboyEmail: currentUser.email,
        motoboyNome: currentUser.nome,
        motoboyTel: currentUser.tel
    });
};

window.updateStatus = async (id, novoStatus) => {
    await updateDoc(doc(db, "pedidos", id), { status: novoStatus });
    if(novoStatus === 'finalizado') alert("Entrega concluída!");
};