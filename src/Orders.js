import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import {
  getFirestore,
  collection,
  updateDoc,
  doc,
  deleteDoc,
  getDocs,
  arrayUnion
} from "firebase/firestore";
import firebaseApp from "./firebase";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PhoneIcon from "@mui/icons-material/Phone";

import format from "date-fns/format";
import { ru } from "date-fns/locale";
import { DotWave } from "@uiball/loaders";
import { ToastContainer, toast } from "react-toastify";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedOrder, setEditedOrder] = useState(null);
  const [orderImages, setOrderImages] = useState({});
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState("");
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [searchPickupDate, setSearchPickupDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchDate, setSearchDate] = useState(null);
  const db = getFirestore(firebaseApp);

  const handleOpenDialog = (order) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedOrder(null);
    setOpenDialog(false);
  };

  const handleEditOrder = (order) => {
    setEditedOrder(order);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditedOrder(null);
    setEditDialogOpen(false);
  };

  const handleEditOrderSubmit = async () => {
    if (editedOrder) {
      try {
        const orderRef = doc(db, "orders", editedOrder.id);

        // Check if orderStatus is defined in editedOrder
        if (editedOrder.orderStatus !== undefined) {
          const updatedData = {
            customerName: editedOrder.customerName,
            product: editedOrder.product,
            phoneNumber: editedOrder.phoneNumber,
            comments: editedOrder.comments,
            orderStatus: editedOrder.orderStatus // Добавляем статус заказа
          };

          await updateDoc(orderRef, updatedData);
        } else {
          console.error("orderStatus is undefined in editedOrder");
          // Handle this case as needed, you may want to show an error message.
        }

        const updatedOrders = orders.map((order) =>
          order.id === editedOrder.id ? editedOrder : order
        );
        setOrders(updatedOrders);
        setEditDialogOpen(false);
        toast.warn("😐 Заказ обновлён!", {
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
        console.error("Ошибка при обновлении заказа:", error);
      }
    }
  };

  const fetchOrdersFromDatabase = async () => {
    try {
      const ordersCollection = collection(db, "orders");
      const querySnapshot = await getDocs(ordersCollection);
      const ordersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      const images = {};
      ordersData.forEach((order) => {
        images[order.id] = order.photos || [];
      });

      setOrderImages(images);
      setOrders(ordersData);
    } catch (error) {
      console.error("Ошибка при получении заказов из Firestore:", error);
    }
  };

  useEffect(() => {
    fetchOrdersFromDatabase();
  }, []);

  const handleDeleteOrder = async (orderId) => {
    if (orderId) {
      try {
        const orderRef = doc(db, "orders", orderId);
        await deleteDoc(orderRef);

        const updatedOrders = orders.filter((order) => order.id !== orderId);
        setOrders(updatedOrders);
        toast.error("😭 Заказ удалён!", {
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
        console.error("Ошибка при удалении заказа:", error);
      }
    }
  };

  const handleDeleteImage = (orderId, imageIndex) => {
    const updatedOrderImages = { ...orderImages };

    if (updatedOrderImages[orderId]) {
      updatedOrderImages[orderId].splice(imageIndex, 1);
      setOrderImages(updatedOrderImages);
      updateImagesInFirestore(orderId, updatedOrderImages[orderId]);
      toast.error("😭 Фото удалён!", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored"
      });
    }
  };

  const updateImagesInFirestore = async (orderId, images) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        photos: images
      });
      console.log("Изображения успешно обновлены в Firestore");
    } catch (error) {
      console.error("Ошибка при обновлении изображений в Firestore:", error);
    }
  };

  const handlePhotoSelection = (e) => {
    const files = e.target.files;
    const selected = [];

    for (let i = 0; i < files.length; i++) {
      selected.push(files[i]);
    }

    setSelectedPhotos(selected);
  };

  const handleSavePhotos = async () => {
    if (selectedOrder && selectedPhotos.length > 0) {
      try {
        setIsLoading(true);
        const orderRef = doc(db, "orders", selectedOrder.id);

        // Получаем ссылку на хранилище (Storage)
        const storage = getStorage(firebaseApp);
        const storageRef = ref(storage, `${selectedOrder.id}/`); // Путь к папке, где будут храниться фотографии заказа

        const photoUrls = [];

        for (let i = 0; i < selectedPhotos.length; i++) {
          const photo = selectedPhotos[i];
          const photoName = `${Date.now()}_${photo.name}`;
          const photoRef = ref(storageRef, photoName);

          // Загружаем фотографию в хранилище
          await uploadBytes(photoRef, photo);

          // Получаем URL загруженной фотографии
          const downloadUrl = await getDownloadURL(photoRef);
          photoUrls.push(downloadUrl);
        }

        // Обновляем состояние заказа с новыми фотографиями
        const updatedPhotos = [...orderImages[selectedOrder.id], ...photoUrls];
        setOrderImages({
          ...orderImages,
          [selectedOrder.id]: updatedPhotos
        });

        // Обновляем фотографии в Firestore
        await updateDoc(orderRef, {
          photos: arrayUnion(...photoUrls)
        });

        // Очищаем состояние выбранных фотографий
        setSelectedPhotos([]);
        setIsLoading(false);
        toast.success("📷 Фотографии добавлены!", {
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
        console.error("Ошибка при сохранении фотографий:", error);
        setIsLoading(false);
      }
    }
  };

  const filteredOrders = orders
    .filter((order) => {
      return (
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.phoneNumber.includes(searchQuery)
      );
    })
    .filter(
      (order) => selectedProduct === "" || order.product === selectedProduct
    )
    .filter((order) => {
      if (!searchDate) {
        return true; // Если дата создания не указана, показываем все заказы
      } else {
        const orderDate = order.timestamp.toDate();
        const formattedOrderDate = format(orderDate, "yyyy-MM-dd");
        return formattedOrderDate === searchDate;
      }
    })
    .filter((order) => {
      if (!searchPickupDate) {
        return true; // Если дата забора не указана, показываем все заказы
      } else if (order.pickupDate) {
        const pickupDate = order.pickupDate.toDate();
        const formattedPickupDate = format(pickupDate, "yyyy-MM-dd");
        return formattedPickupDate === searchPickupDate;
      } else {
        return false; // Заказ без даты забора не соответствует поиску по дате забора
      }
    });

  const getOrderStatusColor = (status) => {
    switch (status) {
      case "Забрал":
        return "#4CAF50";
      case "Готово":
        return "#3498DB";
      case "Отменили":
        return "#FF5733";
      case "Готовится":
        return "#FFD700";
      default:
        return "#FFD700";
    }
  };

  const handleOpenStatusDialog = (order) => {
    setSelectedOrderStatus(order.orderStatus || "");
    setSelectedOrder(order);
    setOpenStatusDialog(true);
  };

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
    setSelectedOrderStatus("");
    setSelectedOrder(null);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        orderStatus: newStatus
      });

      const updatedOrders = orders.map((order) =>
        order.id === orderId ? { ...order, orderStatus: newStatus } : order
      );
      setOrders(updatedOrders);
      toast.info(`Статус заказа #${orderId} обновлен: ${newStatus}`, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored"
      });
      setOpenStatusDialog(false);
    } catch (error) {
      console.error("Ошибка при обновлении статуса заказа:", error);
    }
  };

  return (
    <>
      <Container maxWidth="lg">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Поиск заказов по заказчику, номеру телефона или дате создания"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Дата создания заказа"
              type="date"
              variant="outlined"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              InputLabelProps={{
                shrink: true
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Дата когда заберет"
              type="date"
              variant="outlined"
              value={searchPickupDate}
              onChange={(e) => setSearchPickupDate(e.target.value)}
              InputLabelProps={{
                shrink: true
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Продукт</InputLabel>
              <Select
                label="Продукт"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <MenuItem value="">Все продукты</MenuItem>
                <MenuItem value="Футболка">Футболка</MenuItem>
                <MenuItem value="Кружка">Кружка</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <br />
        {orders.length === 0 ? (
          <div className="dot-wave">
            <DotWave size={80} speed={1} color="rgba(25, 118, 210,0.9)" />
          </div>
        ) : (
          <Grid container spacing={2}>
            {filteredOrders.map((order) => (
              <Grid item xs={12} sm={6} md={4} key={order.id}>
                <Paper
                  elevation={3}
                  style={{
                    padding: "16px",
                    backgroundColor: "rgba(255, 255, 255,0.5)"
                  }}
                >
                  <Grid
                    container
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      <b> Заказ # </b>
                      {order.id}
                    </Typography>
                    <div>
                      <IconButton
                        onClick={() => handleEditOrder(order)}
                        aria-label="Edit"
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteOrder(order.id)}
                        aria-label="Delete"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </div>
                  </Grid>
                  <Typography variant="body1" gutterBottom>
                    Заказчик: {order.customerName}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Продукт: {order.product}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Номер телефона: {order.phoneNumber}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Дата создания:{" "}
                    {format(order.timestamp.toDate(), "d MMMM yyyy", {
                      locale: ru
                    })}
                  </Typography>

                  <div
                    style={{
                      display: "flex",

                      alignItems: "center",

                      marginBottom: "8px"
                    }}
                  >
                    <Typography variant="body1" gutterBottom>
                      Статус: {order.orderStatus || "Готовится"}
                    </Typography>
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "6px",
                        backgroundColor: getOrderStatusColor(order.orderStatus),
                        marginLeft: "8px",
                        marginTop: "-6px",
                        cursor: "pointer"
                      }}
                      onClick={() => handleOpenStatusDialog(order)}
                    />
                  </div>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleOpenDialog(order)}
                  >
                    Подробнее
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle variant="body1">
            <b>Подробная информация о заказе #</b>{" "}
            {selectedOrder ? selectedOrder.id : ""}
          </DialogTitle>
          <DialogContent>
            {selectedOrder && (
              <div>
                <Typography variant="body1" gutterBottom>
                  Заказчик: {selectedOrder.customerName}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Продукт: {selectedOrder.product}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Номер телефона: {selectedOrder.phoneNumber}
                  <a href={`tel:${selectedOrder.phoneNumber}`}>
                    <PhoneIcon color="primary" />
                  </a>
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Коментарии: {selectedOrder.comments}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Аванс: {selectedOrder.orderAdvance}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Сумма: {selectedOrder.orderAmount}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Дата создания:{" "}
                  {format(
                    selectedOrder.timestamp.toDate(),
                    "d MMMM yyyy HH:mm",
                    {
                      locale: ru
                    }
                  )}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Когда заберет:{" "}
                  {selectedOrder.pickupDate // Выводим дату забора заказа, если она доступна
                    ? format(
                        selectedOrder.pickupDate.toDate(),
                        "d MMMM yyyy HH:mm",
                        {
                          locale: ru
                        }
                      )
                    : "Когда заберет не указана"}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <div>
                    {orderImages[selectedOrder.id].map((image, index) => (
                      <div key={index}>
                        <img
                          src={image}
                          alt={`Фотография заказа ${selectedOrder.id}`}
                          style={{
                            width: "100px",
                            height: "100px",
                            marginRight: "8px"
                          }}
                        />
                        <IconButton
                          onClick={() =>
                            handleDeleteImage(selectedOrder.id, index)
                          }
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </div>
                    ))}

                    <input
                      accept="image/*"
                      style={{ display: "none" }}
                      id="icon-button-file"
                      type="file"
                      multiple
                      onChange={handlePhotoSelection}
                    />
                    <label htmlFor="icon-button-file">
                      <IconButton
                        color="primary"
                        aria-label="upload picture"
                        component="span"
                        style={{ marginTop: "16px" }}
                      >
                        <PhotoCamera />
                      </IconButton>
                    </label>

                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSavePhotos}
                      disabled={selectedPhotos.length === 0 || isLoading}
                      style={{ marginTop: "16px", marginLeft: "20px" }}
                    >
                      {isLoading ? (
                        <DotWave
                          size={50}
                          speed={1}
                          color="rgba(25, 118, 210)"
                        />
                      ) : (
                        "Сохранить фотографии"
                      )}
                    </Button>
                  </div>
                </Typography>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCloseDialog}
              color="secondary"
              variant="contained"
            >
              Закрыть
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={editDialogOpen} onClose={handleEditDialogClose}>
          <DialogTitle>
            Изменить заказ #{editedOrder ? editedOrder.id : ""}
          </DialogTitle>
          <DialogContent>
            {editedOrder && (
              <div>
                <TextField
                  fullWidth
                  label="Имя заказчика"
                  variant="outlined"
                  value={editedOrder.customerName}
                  style={{ marginBottom: 16 }}
                  onChange={(e) =>
                    setEditedOrder({
                      ...editedOrder,
                      customerName: e.target.value
                    })
                  }
                />
                <TextField
                  fullWidth
                  label="Продукт"
                  variant="outlined"
                  value={editedOrder.product}
                  style={{ marginBottom: 16 }}
                  onChange={(e) =>
                    setEditedOrder({
                      ...editedOrder,
                      product: e.target.value
                    })
                  }
                />
                <TextField
                  fullWidth
                  label="Номер телефона"
                  variant="outlined"
                  value={editedOrder.phoneNumber}
                  style={{ marginBottom: 16 }}
                  onChange={(e) =>
                    setEditedOrder({
                      ...editedOrder,
                      phoneNumber: e.target.value
                    })
                  }
                />
                <TextField
                  fullWidth
                  label="Комментарии"
                  variant="outlined"
                  value={editedOrder.comments}
                  style={{ marginBottom: 16 }}
                  onChange={(e) =>
                    setEditedOrder({
                      ...editedOrder,
                      comments: e.target.value
                    })
                  }
                />
                <TextField
                  fullWidth
                  label="Аванс"
                  variant="outlined"
                  value={editedOrder.orderAdvance}
                  style={{ marginBottom: 16 }}
                  onChange={(e) =>
                    setEditedOrder({
                      ...editedOrder,
                      orderAdvance: e.target.value
                    })
                  }
                />
                <TextField
                  fullWidth
                  label="Сумма"
                  variant="outlined"
                  value={editedOrder.orderAmount}
                  onChange={(e) =>
                    setEditedOrder({
                      ...editedOrder,
                      orderAmount: e.target.value
                    })
                  }
                />
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleEditDialogClose}
              color="secondary"
              variant="contained"
            >
              Отмена
            </Button>
            <Button
              onClick={handleEditOrderSubmit}
              color="primary"
              variant="contained"
            >
              Обновить заказ
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openStatusDialog} onClose={handleCloseStatusDialog}>
          <DialogTitle>
            Изменить статус заказа #{selectedOrder ? selectedOrder.id : ""}
          </DialogTitle>
          <DialogContent>
            <FormControl fullWidth variant="outlined">
              <InputLabel style={{ marginTop: "5px" }}>
                Статус заказа
              </InputLabel>
              <Select
                label="Статус заказа"
                value={selectedOrderStatus}
                onChange={(e) => setSelectedOrderStatus(e.target.value)}
              >
                <MenuItem value="Забрал">Забрал</MenuItem>
                <MenuItem value="Готово">Готово</MenuItem>
                <MenuItem value="Отменили">Отменили</MenuItem>
                <MenuItem value="Готовится">Готовится</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCloseStatusDialog}
              color="secondary"
              variant="contained"
            >
              Отмена
            </Button>
            <Button
              onClick={() =>
                handleStatusChange(selectedOrder.id, selectedOrderStatus)
              }
              color="primary"
              variant="contained"
            >
              Сохранить статус
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
      <ToastContainer />
    </>
  );
};

export default Orders;
