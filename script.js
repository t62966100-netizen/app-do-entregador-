import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, onSnapshot } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { 
    apiKey: "AIzaSyBSCGwRzGkfyYREBk9R9etbNWgghd2NRmU",
    authDomain: "uber-entrega-bc28f.firebaseapp.com",
    projectId: "uber-entrega-bc28f",
    storageBucket: "uber-entrega-bc28f.firebasestorage.app",
    messagingSenderId: "59703521556",
    appId: "1:59703521556:web:703a1a3534c494957c5201"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentUser = JSON.parse(localStorage.getItem('user_motoboy'));

// Expor funções para o HTML
window.showScreen = (screenId) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(screenId);
    if(target) target.classList.remove('hidden');
};

window.login = async () => {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    try {
        const docSnap = await getDoc(doc(db, "usuarios", email));
        if (docSnap.exists() && docSnap.data().senha === senha) {
            localStorage.setItem('user_motoboy', JSON.stringify(docSnap.data()));
            location.reload();
        } else {
            alert("Usuário ou senha inválidos!");
        }
    } catch (e) { console.error(e); alert("Erro ao logar"); }
};

window.register = async () => {
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const tel = document.getElementById('reg-tel').value;
    const senha = document.getElementById('reg-senha').value;

    if(!nome || !email || !senha) return alert("Preencha os campos!");

    const user = { nome, email, senha, tel, tipo: 'motoboy' };
    try {
        await setDoc(doc(db, "usuarios", email), user);
        localStorage.setItem('user_motoboy', JSON.stringify(user));
        location.reload();
    } catch (e) { console.error(e); alert("Erro ao cadastrar"); }
};

window.logout = () => { localStorage.removeItem('user_motoboy'); location.reload(); };

// Lógica de monitoramento de pedidos
if(currentUser) {
    window.showScreen('screen-home');
    
    // Monitorar pedidos que estão: procurando, aceito ou em entrega
    const q = query(collection(db, "pedidos"), where("status", "in", ["procurando", "aceito", "em entrega"]));
    
    onSnapshot(q, (snapshot) => {
        const lista = document.getElementById('lista-pedidos');
        const activeArea = document.getElementById('active-delivery');
        const availableListArea = document.getElementById('available-list');
        
        let temPedidoAtivo = false;
        let htmlPedidosDisponiveis = "";

        snapshot.forEach((d) => {
            const p = d.data();
            const id = d.id;

            // Caso 1: O pedido pertence a este motoboy e não acabou
            if(p.motoboyEmail === currentUser.email) {
                temPedidoAtivo = true;
                activeArea.classList.remove('hidden');
                activeArea.innerHTML = `
                    <div class="card-order" style="border: 2px solid #2ecc71; background: #ebfef2">
                        <h4 style="color:#27ae60">Sua Entrega Atual</h4>
                        <p><b>De:</b> ${p.coleta}</p>
                        <p><b>Para:</b> ${p.entrega}</p>
                        <p><b>Cliente:</b> ${p.clienteNome} (${p.clienteTel})</p>
                        <p><b>Item:</b> ${p.descricao || 'Não informado'}</p>
                        <br>
                        ${p.status === 'aceito' ? 
                            `<button onclick="updateStatus('${id}', 'em entrega')" class="btn-main">Iniciar Corrida Agora</button>` : 
                            `<button onclick="updateStatus('${id}', 'finalizado')" class="btn-main" style="background:#27ae60">Finalizar Entrega</button>`
                        }
                    </div>
                `;
            } 
            // Caso 2: O pedido está livre
            else if(p.status === 'procurando') {
                htmlPedidosDisponiveis += `
                    <div class="card-order">
                        <p><b>Coleta:</b> ${p.coleta}</p>
                        <p><b>Entrega:</b> ${p.entrega}</p>
                        <p><b>Valor:</b> ${p.valor}</p>
                        <button onclick="aceitarPedido('${id}')" class="btn-main">Aceitar Entrega</button>
                    </div>
                `;
            }
        });

        // Se estiver em uma entrega, esconde a lista de outras disponíveis
        if(temPedidoAtivo) {
            availableListArea.classList.add('hidden');
        } else {
            availableListArea.classList.remove('hidden');
            lista.innerHTML = htmlPedidosDisponiveis || "<p style='text-align:center; padding:20px;'>Nenhuma entrega disponível no momento...</p>";
        }
    });
} else {
    window.showScreen('screen-login');
}

window.aceitarPedido = async (id) => {
    try {
        await updateDoc(doc(db, "pedidos", id), {
            status: 'aceito',
            motoboyEmail: currentUser.email,
            motoboyNome: currentUser.nome,
            motoboyTel: currentUser.tel
        });
        alert("Você aceitou a entrega!");
    } catch (e) { console.error(e); }
};

window.updateStatus = async (id, novoStatus) => {
    try {
        await updateDoc(doc(db, "pedidos", id), { status: novoStatus });
        if(novoStatus === 'finalizado') {
            alert("Parabéns! Entrega finalizada.");
            document.getElementById('active-delivery').classList.add('hidden');
        }
    } catch (e) { console.error(e); }
};