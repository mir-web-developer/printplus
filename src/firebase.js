import { initializeApp } from "firebase/app";
import "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDiT995KdqBYLR5IEuD8FzdZK6Ab132J78",
  authDomain: "printplus-2615c.firebaseapp.com",
  projectId: "printplus-2615c",
  storageBucket: "printplus-2615c.appspot.com",
  messagingSenderId: "826255618460",
  appId: "1:826255618460:web:827faef1e24a8518b95859",
  measurementId: "G-Y1MM6TTGTG"
};

const firebaseApp = initializeApp(firebaseConfig);

export default firebaseApp;
