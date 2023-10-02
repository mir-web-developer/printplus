import React, { useState, useEffect } from "react";
import { Container, Grid, Paper, Typography } from "@mui/material";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { Bar, Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
const StatisticsPage = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const db = getFirestore();
      const ordersCollection = collection(db, "orders");
      const querySnapshot = await getDocs(ordersCollection);
      const ordersData = [];

      querySnapshot.forEach((doc) => {
        ordersData.push(doc.data());
      });

      setOrders(ordersData);
    };

    fetchData();
  }, []);

  // Функция для вычисления ежедневной суммы заказов
  const calculateDailyTotal = () => {
    const dailyData = {};

    orders.forEach((order) => {
      const orderDate = order.timestamp?.toDate();
      if (orderDate) {
        const dayMonthYear = `${orderDate.getDate()}-${
          orderDate.getMonth() + 1
        }-${orderDate.getFullYear()}`;

        if (!dailyData[dayMonthYear]) {
          dailyData[dayMonthYear] = 0;
        }

        dailyData[dayMonthYear] += parseFloat(order.orderAmount);
      }
    });

    const labels = Object.keys(dailyData);
    const data = {
      labels,
      datasets: [
        {
          label: "Ежедневная сумма заказов",
          data: Object.values(dailyData),
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1
        }
      ]
    };

    return data;
  };

  // Функция для вычисления ежемесячной суммы заказов
  const calculateMonthlyTotal = () => {
    const monthlyData = {};

    orders.forEach((order) => {
      const orderDate = order.timestamp.toDate();
      const monthYear = `${orderDate.getFullYear()}-${
        orderDate.getMonth() + 1
      }`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = 0;
      }

      monthlyData[monthYear] += parseFloat(order.orderAmount);
    });

    const labels = Object.keys(monthlyData);
    const data = {
      labels,
      datasets: [
        {
          label: "Ежемесячная сумма заказов",
          data: Object.values(monthlyData),
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1
        }
      ]
    };

    return data;
  };

  // Функция для вычисления количества заказов по продуктам
  const calculateOrderCountByProduct = () => {
    const productData = {};

    orders.forEach((order) => {
      const { product } = order;

      if (!productData[product]) {
        productData[product] = 0;
      }

      productData[product]++;
    });

    const labels = Object.keys(productData);
    const data = {
      labels,
      datasets: [
        {
          label: "Количество заказов",
          data: Object.values(productData),
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1
        }
      ]
    };

    return data;
  };

  // Функция для вычисления ежедневного количества заказов по продуктам
  const calculateDailyOrderCountByProduct = () => {
    const dailyProductData = {};

    orders.forEach((order) => {
      const orderDate = order.timestamp?.toDate();
      if (orderDate) {
        const dayMonthYear = `${orderDate.getDate()}-${
          orderDate.getMonth() + 1
        }-${orderDate.getFullYear()}`;
        const { product } = order;

        if (!dailyProductData[dayMonthYear]) {
          dailyProductData[dayMonthYear] = {};
        }

        if (!dailyProductData[dayMonthYear][product]) {
          dailyProductData[dayMonthYear][product] = 0;
        }

        dailyProductData[dayMonthYear][product]++;
      }
    });

    const labels = Object.keys(dailyProductData);
    const datasets = Object.keys(
      orders.reduce((acc, order) => {
        acc[order.product] = true;
        return acc;
      }, {})
    ).map((product) => ({
      label: product,
      data: labels.map((date) => dailyProductData[date][product] || 0),
      backgroundColor: getRandomColor(),
      borderColor: getRandomColor(),
      borderWidth: 1
    }));

    return {
      labels,
      datasets
    };
  };

  // Функция для вычисления ежемесячного количества заказов по продуктам
  const calculateMonthlyOrderCountByProduct = () => {
    const monthlyProductData = {};

    orders.forEach((order) => {
      const orderDate = order.timestamp.toDate();
      const monthYear = `${orderDate.getFullYear()}-${
        orderDate.getMonth() + 1
      }`;
      const { product } = order;

      if (!monthlyProductData[monthYear]) {
        monthlyProductData[monthYear] = {};
      }

      if (!monthlyProductData[monthYear][product]) {
        monthlyProductData[monthYear][product] = 0;
      }

      monthlyProductData[monthYear][product]++;
    });

    const labels = Object.keys(monthlyProductData);
    const datasets = Object.keys(
      orders.reduce((acc, order) => {
        acc[order.product] = true;
        return acc;
      }, {})
    ).map((product) => ({
      label: product,
      data: labels.map((date) => monthlyProductData[date][product] || 0),
      backgroundColor: getRandomColor(),
      borderColor: getRandomColor(),
      borderWidth: 1
    }));

    return {
      labels,
      datasets
    };
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Статистика
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper style={{ padding: "10px" }}>
            <Typography variant="h6" gutterBottom>
              График ежедневной суммы заказов
            </Typography>
            <Line data={calculateDailyTotal()} />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper style={{ padding: "10px" }}>
            <Typography variant="h6" gutterBottom>
              График ежемесячной суммы заказов
            </Typography>
            <Bar data={calculateMonthlyTotal()} />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper style={{ padding: "10px" }}>
            <Typography variant="h6" gutterBottom>
              Количество заказов по продуктам
            </Typography>
            <Bar data={calculateOrderCountByProduct()} />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper style={{ padding: "10px" }}>
            <Typography variant="h6" gutterBottom>
              Ежедневное количество заказов по продуктам
            </Typography>
            <Bar data={calculateDailyOrderCountByProduct()} />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper style={{ padding: "10px" }}>
            <Typography variant="h6" gutterBottom>
              Ежемесячное количество заказов по продуктам
            </Typography>
            <Bar data={calculateMonthlyOrderCountByProduct()} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StatisticsPage;

// Дополнительная функция для генерации случайного цвета
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
