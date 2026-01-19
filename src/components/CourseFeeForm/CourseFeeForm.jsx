// src/components/courses/CourseFeeForm.jsx

import {
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

const COMMON_CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "INR", name: "Indian Rupee" },
  { code: "GBP", name: "British Pound" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
];
// eslint-disable-next-line react/prop-types
const CourseFeeForm = ({ feeData, onSave }) => {
  // eslint-disable-next-line react/prop-types
  const [isFree, setIsFree] = useState(feeData?.is_free ?? true);
  // eslint-disable-next-line react/prop-types
  const [price, setPrice] = useState(feeData?.price ?? 0);
  // eslint-disable-next-line react/prop-types
  const [currency, setCurrency] = useState(feeData?.currency ?? "USD");
  const [error, setError] = useState("");

  // Sync state when feeData changes (e.g., after save)
  useEffect(() => {
    if (feeData) {
      // eslint-disable-next-line react/prop-types
      setIsFree(feeData.is_free);
      // eslint-disable-next-line react/prop-types
      setPrice(feeData.price);
      // eslint-disable-next-line react/prop-types
      setCurrency(feeData.currency);
    }
  }, [feeData]);

  const handleSubmit = () => {
    setError("");

    if (!isFree) {
      const numPrice = parseFloat(price);
      if (isNaN(numPrice) || numPrice <= 0) {
        setError("Price must be a valid number greater than 0");
        return;
      }
    }

    const payload = {
      is_free: isFree,
      price: isFree ? 0 : parseFloat(price),
      currency: isFree ? "USD" : currency,
    };

    onSave(payload);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
            />
          }
          label={isFree ? "Free Course" : "Paid Course"}
        />
      </Box>

      {!isFree && (
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            label="Price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            InputProps={{ inputProps: { min: 0.01, step: 0.01 } }}
            fullWidth
            error={!!error}
            helperText={error || "One-time payment"}
          />
          <TextField
            select
            label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            {COMMON_CURRENCIES.map((curr) => (
              <MenuItem key={curr.code} value={curr.code}>
                {curr.code}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      )}

      {isFree && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This course is free. Learners can enroll without payment.
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        fullWidth
      >
        Save Pricing
      </Button>
    </Paper>
  );
};

export default CourseFeeForm;
