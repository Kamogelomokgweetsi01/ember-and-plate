import {db} from '../firebase/config.js';
import {collection, doc, addDoc, getDoc, getDocs} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';

export async function getAllData(collectionName) {
    const snapshot = await getDocs(collection(db, collectionName))

    return snapshot.docs.map((document)=>({
        id : document.id,
        ...document.data()

    }))
}

// save data wgith an automatically generated ID
export async function saveData(collectionName, data){
    const docRef = await addDoc(
        collection(db, collectionName),
        data
    );
    
    return docRef.id;
}

// save data using a specific document ID
export async function saveDataWithId(collectionName, id, data){
await setDoc(doc(db, collectionName, id), data);
return id;
}

// retrieve one document by ID
export async function getDataById(collectionName, id) {
    const snapshot = await getDoc(
        doc(db, collectionName, id)
    );
    return snapshot;
}