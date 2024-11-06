// Importar Firebase y las funciones necesarias
import './firebase.js';
import { auth, db, storage } from './firebase.js';
import { onAuthStateChanged, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { query, orderBy, collection, addDoc, getDocs, deleteDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// Elementos del DOM
let nombreUsuario = document.getElementById("displayName");
let publicacionesDiv = document.getElementById("publicaciones");
let botonPublicar = document.getElementById("publicar");
let nuevaPublicacion = document.getElementById("nueva_publicacion");
let fotoPublicacion = document.getElementById("foto_publicacion");
let videoPublicacion = document.getElementById("video_publicacion");

let idUsuario = null;

// Modal de edición
let modalEditar = new bootstrap.Modal(document.getElementById('editarModal'));
let nuevoTexto = document.getElementById("nuevoTexto");
let idActualEdicion = null;

// Modal para editar perfil
let nuevoNombre = document.getElementById("nuevoNombre");
let nuevaFoto = document.getElementById("nuevaFoto");
let guardarPerfilBtn = document.getElementById("guardarPerfil");

console.log("hola mundo");

// Escuchar los cambios de autenticación
onAuthStateChanged(auth, (usuario) => {
    if (usuario) {
        nombreUsuario.innerHTML = usuario.displayName || "Usuario";
        idUsuario = usuario.uid;

        // Actualizar foto de perfil
        const fotoPerfil = document.getElementById("fotoPerfil");
        fotoPerfil.src = usuario.photoURL || "user.jpg";
    } else {
        window.location.href = "login.html";
    }
});

// Publicar nueva publicación
botonPublicar.addEventListener("click", async () => {
    if (nuevaPublicacion.value.trim() !== "" || fotoPublicacion.files.length > 0 || videoPublicacion.files.length > 0) {
        try {
            let urlFoto = null;
            let urlVideo = null;

            if (fotoPublicacion.files.length > 0) {
                const archivoFoto = fotoPublicacion.files[0];
                const fotoRef = ref(storage, 'fotos_publicaciones/' + archivoFoto.name);
                await uploadBytes(fotoRef, archivoFoto);
                urlFoto = await getDownloadURL(fotoRef);
            }

            if (videoPublicacion.files.length > 0) {
                const archivoVideo = videoPublicacion.files[0];
                const videoRef = ref(storage, 'videos_publicaciones/' + archivoVideo.name);
                await uploadBytes(videoRef, archivoVideo);
                urlVideo = await getDownloadURL(videoRef);
            }

            await addDoc(collection(db, "publicaciones"), {
                texto: nuevaPublicacion.value,
                userId: idUsuario,
                userName: auth.currentUser.displayName,
                photoURL: auth.currentUser.photoURL,
                imagenPublicacion: urlFoto,
                videoPublicacion: urlVideo,
                timestamp: new Date()
            });

            nuevaPublicacion.value = "";
            fotoPublicacion.value = "";
            videoPublicacion.value = "";

            cargarPublicaciones();
        } catch (error) {
            console.log("Error al publicar: ", error);
        }
    } else {
        console.log("El campo de publicación está vacío.");
    }
});

// Cargar todas las publicaciones
async function cargarPublicaciones() {
    publicacionesDiv.innerHTML = "";
    const publicacionesQuery = query(collection(db, "publicaciones"), orderBy("timestamp", "desc"));
    const consulta = await getDocs(publicacionesQuery);

    consulta.forEach((doc) => {
        const publicacion = doc.data();
        const publicacionDiv = document.createElement("div");
        publicacionDiv.classList.add("publicacion");

        const fechaPublicacion = publicacion.timestamp.toDate();
        const horaPublicacion = fechaPublicacion.toLocaleTimeString();
        const fechaFormateada = fechaPublicacion.toLocaleDateString();

        let fotoPerfil = publicacion.photoURL || "user.jpg";
        let contenido = `
            <img src="${fotoPerfil}" width="40" heigth="40">
            <p><strong>${publicacion.userName}:</strong> ${publicacion.texto}</p>
            <p>${fechaFormateada} ${horaPublicacion}</p>
        `;

        if (publicacion.imagenPublicacion) {
            contenido += `<img src="${publicacion.imagenPublicacion}" width="200" height="200">`;
        }

        if (publicacion.videoPublicacion) {
            contenido += `<video src="${publicacion.videoPublicacion}" controls type="video/mp4"></video>`;
        }

        if (publicacion.userId === idUsuario) {
            contenido += `
                <button onclick="abrirModal('${doc.id}', '${publicacion.texto}')">Editar</button>
                <button onclick="eliminarPublicacion('${doc.id}')">Eliminar</button>
            `;
        }

        contenido += `
         <div class="comentarios" id="comentarios-${doc.id}"></div>
         <textarea id="comentario-${doc.id}" placeholder="Escribe un comentario..."></textarea>
         <button onclick="agregarComentario('${doc.id}')">Comentar</button>
        `;

        publicacionDiv.innerHTML = contenido;
        publicacionesDiv.appendChild(publicacionDiv);

        cargarComentarios(doc.id);
    });
}
cargarPublicaciones();

window.abrirModal = function (id, texto) {
    idActualEdicion = id;
    nuevoTexto.value = texto;
    modalEditar.show();
};

document.getElementById("guardarCambios").addEventListener("click", async () => {
    if (nuevoTexto.value.trim() !== "") {
        try {
            await updateDoc(doc(db, "publicaciones", idActualEdicion), {
                texto: nuevoTexto.value
            });
            modalEditar.hide();
            cargarPublicaciones();
        } catch (error) {
            console.log("Error al editar publicación: ", error);
        }
    }
});

window.eliminarPublicacion = async function (id) {
    try {
        await deleteDoc(doc(db, "publicaciones", id));
        cargarPublicaciones();
    } catch (error) {
        console.log("Error al eliminar publicación: ", error);
    }
};

guardarPerfilBtn.addEventListener("click", async () => {
    let user = auth.currentUser;
    let updates = {};

    if (nuevoNombre.value.trim() !== "") {
        updates.displayName = nuevoNombre.value;
    }

    if (nuevaFoto.files.length > 0) {
        const archivoFoto = nuevaFoto.files[0];
        const fotoRef = ref(storage, 'foto_perfiles/' + user.uid);
        await uploadBytes(fotoRef, archivoFoto);
        const urlFoto = await getDownloadURL(fotoRef);
        updates.photoURL = urlFoto;
    }

    await updateProfile(user, updates);

    if (updates.displayName) {
        nombreUsuario.textContent = updates.displayName;
    }
    if (updates.photoURL) {
        document.getElementById("fotoPerfil").src = updates.photoURL;
    }

    nuevoNombre.value = "";
    nuevaFoto.value = "";

    let actualizarModal = bootstrap.Modal.getInstance(document.getElementById('actualizarModal'));
    actualizarModal.hide();
});

document.getElementById("logoutButton").addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            window.location.href = "login.html";
        })
        .catch((error) => {
            console.log("Error al cerrar sesión: ", error);
        });
});

async function cargarComentarios(publicacionId) {
    const comentariosDiv = document.getElementById(`comentarios-${publicacionId}`);
    comentariosDiv.innerHTML = "";

    const comentariosQuery = query(collection(db, "publicaciones", publicacionId, "comentarios"), orderBy("timestamp", "asc"));
    const comentariosSnapshot = await getDocs(comentariosQuery);

    comentariosSnapshot.forEach((doc) => {
        const comentario = doc.data();
        const comentarioDiv = document.createElement("div");
        comentarioDiv.classList.add("comentario");
        comentarioDiv.innerHTML = `<strong>${comentario.userName}:</strong> ${comentario.texto}`;
        comentariosDiv.appendChild(comentarioDiv);
    });
}

window.agregarComentario = async function (publicacionId) {
    const comentarioInput = document.getElementById(`comentario-${publicacionId}`);
    const textoComentario = comentarioInput.value.trim();

    if (textoComentario !== "") {
        try {
            await addDoc(collection(db, "publicaciones", publicacionId, "comentarios"), {
                texto: textoComentario,
                userId: idUsuario,
                userName: auth.currentUser.displayName,
                timestamp: new Date()
            });

            comentarioInput.value = "";
            cargarComentarios(publicacionId);
        } catch (error) {
            console.log("Error al agregar comentario: ", error);
        }
    }
};