import React, { useEffect, useState } from "react";
import {
  Container,
  Grid,
  Card,
  CardMedia,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  InputAdornment,
  TextareaAutosize
} from "@mui/material";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import firebaseApp from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "firebase/storage";
import { getStorage } from "firebase/storage";
import { ToastContainer, toast } from "react-toastify";
import { DotWave } from "@uiball/loaders";
import "react-toastify/dist/ReactToastify.css";

// Добавим необходимые импорты для компонента DateTimePicker
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

const Home = () => {
  const db = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp);

  const saveOrderToDatabase = async (order) => {
    try {
      const ordersCollection = collection(db, "orders");
      const newOrder = {
        ...order,
        timestamp: serverTimestamp()
      };
      const newOrderRef = await addDoc(ordersCollection, newOrder);
      console.log("Заказ успешно добавлен в Firestore с ID:", newOrderRef.id);
    } catch (error) {
      console.error("Ошибка при добавлении заказа:", error);
    }
  };

  const initialProducts = [
    {
      id: 1,
      name: "Футболка",
      category: "Одежда",
      image:
        "https://drive.google.com/uc?export=view&id=1IhLbds-8FWvAjJ54Ocic6tFflHSfVPLs"
    },
    {
      id: 2,
      name: "Кружка",
      category: "Посуда",
      image:
        "https://drive.google.com/uc?export=view&id=1-qZwmZMdnyUl6A9KPSo97r9G-j4BZUKn"
    },
    {
      id: 3,
      name: "Подушка",
      category: "Декор",
      image:
        "https://drive.google.com/uc?export=view&id=1RE80MMRgEaOCIxncj_ksywve9QvVK3ku"
    }
  ];

  const [products] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [orderSize, setOrderSize] = useState("S");
  const [orderColor, setOrderColor] = useState("Белый");
  const [orderQuality, setOrderQuality] = useState("ХБ");
  const [orderPhoneNumber, setOrderPhoneNumber] = useState("");
  const [orderPhotos, setOrderPhotos] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customerComments, setCustomerComments] = useState("");
  const [orderAmount, setOrderAmount] = useState("");
  const [orderAdvance, setOrderAdvance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pickupDate, setPickupDate] = useState(null); // Состояние для выбора даты и времени забора заказа

  const handleOrderDialogOpen = (product) => {
    setSelectedProduct(product);
    setOpenOrderDialog(true);
  };

  const handleOrderDialogClose = () => {
    setOpenOrderDialog(false);
    setSelectedProduct(null);
    setCustomerName("");
    setOrderSize("S");
    setOrderColor("Белый");
    setOrderQuality("ХБ");
    setOrderPhoneNumber("");
    setOrderPhotos([]);
    setCustomerComments("");
    setOrderAmount("");
    setOrderAdvance("");
    setPickupDate(null); // Сбросить выбранную дату и время
  };
  async function uploadPhotosToStorage(photos) {
    const photoUrls = [];

    for (const photo of photos) {
      try {
        const fileName = uuidv4();
        const storageRef = ref(storage, `photos/${fileName}`);
        await uploadBytes(storageRef, photo);
        const url = await getDownloadURL(storageRef);
        photoUrls.push(url);
      } catch (error) {
        console.error("Ошибка при загрузке фотографии:", error);
      }
    }

    return photoUrls;
  }

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    try {
      // Проверка обязательных полей перед отправкой заказа
      if (
        !customerName ||
        !orderPhoneNumber ||
        !pickupDate ||
        !orderAmount ||
        !orderAdvance
      ) {
        // Если какие-либо обязательные поля не заполнены, не отправляем заказ и показываем сообщение об ошибке
        toast.error("Пожалуйста, заполните все обязательные поля", {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored"
        });
        setIsLoading(false);
        return;
      }

      const photoUrls = await uploadPhotosToStorage(orderPhotos);
      const newOrder = {
        product: selectedProduct.name,
        customerName,
        size: orderSize,
        color: orderColor,
        quality: orderQuality,
        phoneNumber: orderPhoneNumber,
        photos: photoUrls,
        comments: customerComments,
        orderAmount,
        orderAdvance,
        pickupDate
      };
      saveOrderToDatabase(newOrder);
      handleOrderDialogClose();
      setIsLoading(false);
      toast.success("😊 Заказ добавлен!", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored"
      });
    } catch (error) {
      console.error("Ошибка при создании заказа:", error);
    }
  };

  const filteredProducts = products.filter((product) => {
    return (
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategory === "" || product.name === selectedCategory)
    );
  });

  const categoryOptions = [
    { value: "", label: "Все товары" },
    { value: "Футболка", label: "Футболка" },
    { value: "Кружка", label: "Кружка" },
    { value: "Подушка", label: "Подушка" }
  ];

  return (
    <>
      <Container maxWidth="lg">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Поиск товаров"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Товары</InputLabel>
              <Select
                label="Товары"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categoryOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <br />

        <Grid container spacing={2}>
          {filteredProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <CardActionArea onClick={() => handleOrderDialogOpen(product)}>
                <Card elevation={3} style={{ backgroundColor: "transparent" }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={product.image}
                    style={{
                      marginTop: "15px",
                      marginBottom: "15px",
                      maxWidth: "100%",
                      maxHeight: "150px",
                      objectFit: "contain"
                    }}
                    alt={`Фото товара ${product.name}`}
                  />
                </Card>
              </CardActionArea>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Dialog open={openOrderDialog} onClose={handleOrderDialogClose}>
        <DialogTitle>Оформить заказ</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Имя заказчика"
            variant="outlined"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            style={{ marginBottom: 16, marginTop: 16 }}
            required
          />

          <TextField
            fullWidth
            label="Номер телефона заказчика"
            variant="outlined"
            value={orderPhoneNumber}
            onChange={(e) => setOrderPhoneNumber(e.target.value)}
            style={{ marginBottom: 16 }}
            required
          />

          <TextareaAutosize
            minRows={3}
            placeholder="Комментарии заказчика"
            value={customerComments}
            onChange={(e) => setCustomerComments(e.target.value)}
            style={{ width: "100%", marginBottom: 16, padding: 8 }}
            required
          />

          <TextField
            fullWidth
            label="Загрузите фотографии заказчика"
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Button
                    variant="contained"
                    color="primary"
                    component="label" // Используем компонент "label" для обертки input
                  >
                    Загрузить
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: "none" }} // Скрываем input
                      onChange={(e) => {
                        const files = e.target.files;
                        const uploadedPhotos = Array.from(files);
                        setOrderPhotos(uploadedPhotos);
                      }}
                    />
                  </Button>
                </InputAdornment>
              )
            }}
            style={{ marginBottom: 16 }}
          />

          {/* Компонент DateTimePicker для выбора даты и времени забора заказа */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Дата и время когда заберет"
              value={pickupDate}
              onChange={(newValue) => setPickupDate(newValue)}
              renderInput={(params) => (
                <TextField required {...params} fullWidth variant="outlined" />
              )}
              style={{ marginBottom: 16 }}
            />
          </LocalizationProvider>

          <TextField
            fullWidth
            label="Сумма"
            variant="outlined"
            value={orderAmount}
            onChange={(e) => setOrderAmount(e.target.value)}
            style={{ marginBottom: 16, marginTop: 16 }}
            required
          />

          <TextField
            fullWidth
            label="Аванс"
            variant="outlined"
            value={orderAdvance}
            onChange={(e) => setOrderAdvance(e.target.value)}
            style={{ marginBottom: 16 }}
            required
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handlePlaceOrder}
            style={{ marginRight: 16 }}
          >
            {isLoading ? (
              <DotWave size={50} speed={1} color="white" />
            ) : (
              "Разместить заказ"
            )}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleOrderDialogClose}
          >
            Отменить
          </Button>
        </DialogContent>
      </Dialog>
      <ToastContainer />
    </>
  );
};

export default Home;
