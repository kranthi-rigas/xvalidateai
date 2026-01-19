// src/pages/CourseFeeStructurePage.jsx

import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import CourseFeeForm from "@/components/CourseFeeForm/CourseFeeForm";
import { useParams } from "react-router-dom";

// Mock API functions — replace with your real API service
// const fetchCourseFee = async (courseId) => {
//   // Simulate API delay
//   // await new Promise((res) => setTimeout(res, 200));

//   // TODO: Replace with actual API call
//   // const res = await fetch(`/api/courses/${courseId}/fee`);
//   // if (!res.ok) throw new Error('Failed to fetch fee structure');
//   // return res.json();

//   // Mock response
//   return {
//     course_id: courseId,
//     is_free: false,
//     price: 49.99,
//     currency: "USD",
//   };
// };

const updateCourseFee = async (courseId, payload) => {
  // TODO: Replace with real PUT request
  console.log(`PUT /api/courses/${courseId}/fee`, payload);
  await new Promise((res) => setTimeout(res, 500)); // simulate network
  return { ...payload, course_id: courseId };
};

const CourseFeeStructurePage = () => {
  const { courseId } = useParams(); // gets "1" from /courses-feestructure/1
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch on mount
  useEffect(() => {
    const loadFee = async () => {
      try {
        setLoading(true);
        setError(null);
        // const data = await fetchCourseFee(courseId);
        setFeeData({
          course_id: courseId,
          is_free: false,
          price: 49.99,
          currency: "USD",
        });
      } catch (err) {
        setError(err.message || "Failed to load course fee");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadFee();
    }
  }, [courseId]);

  const handleSave = async (payload) => {
    try {
      const updated = await updateCourseFee(courseId, payload);
      setFeeData(updated);
      setSaveSuccess(true);
      // Auto-hide success after 3 sec
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      throw new Error(err.message || "Save failed");
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading course fee...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 6 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">
          Fee Structure — Course ID: {courseId}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Set pricing for this course
        </Typography>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Fee structure updated successfully!
        </Alert>
      )}

      <CourseFeeForm
        courseId={courseId}
        feeData={feeData}
        onSave={handleSave}
      />
    </Container>
  );
};

export default CourseFeeStructurePage;
