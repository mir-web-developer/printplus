// AppRouters.js
import React from "react";
import { Route, Switch } from "react-router-dom";
import Home from "./Home"; // Import your Home component
import Orders from "./Orders"; // Import your Orders component
import AppPanel from "./AppPanel";
import "./styles.css";
import "custom-cursor-react/dist/index.css";
import CustomCursor from "./CustomCursor";
import StatisticsPage from "./statistics/StatisticsPage";
import Catalog from "./catalog/Catalog";
import TShirt from "./catalog/TShirt";

const App = () => {
  return (
    <>
      <AppPanel />
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/orders" component={Orders} />
        <Route path="/statistics" component={StatisticsPage} />
        <Route path="/catalog" component={Catalog} />
        <Route path="/tshirt" component={TShirt} />
        {/* Add more routes if needed */}
      </Switch>
      <CustomCursor />
    </>
  );
};

export default App; // Export as the default export
