import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import { Box, AppBar, Toolbar, Typography, Button } from "@mui/material";

function App() {
    return (
        <Router>
            <AppBar position="static" sx={{ backgroundColor: "#1976D2" }}>
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        AI-Powered Requirements Analysis
                    </Typography>
                    <Button color="inherit" component={Link} to="/">
                        Dashboard
                    </Button>
                </Toolbar>
            </AppBar>

            <Box sx={{ p: 3 }}>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard/:taskId" element={<Dashboard />} />
                </Routes>
            </Box>
        </Router>
    );
}

export default App;