// src/screens/PaymentScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useCart } from '../context/CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';
import colors from '../constants/colors';

export default function PaymentScreen({ navigation, route }) {
  const { orderData } = route.params || {};
  
  if (!orderData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order data not found. Please try again.</Text>
        </View>
      </View>
    );
  }
  
  const { clearCart } = useCart();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = [
    {
      id: 'gcash',
      name: 'GCash',
      description: 'Pay securely with GCash mobile wallet',
      icon: '📱',
      fee: 0,
    },
    {
      id: 'credit_card',
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, and other cards',
      icon: '💳',
      fee: 25,
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Direct transfer to our account',
      icon: '🏦',
      fee: 0,
    },
  ];

  const updateOrderInStorage = async (updatedOrder) => {
    try {
      const savedOrders = await AsyncStorage.getItem('pendingOrders');
      const orders = savedOrders ? JSON.parse(savedOrders) : [];
      const updatedOrders = orders.map(o => o.orderRef === updatedOrder.orderRef ? updatedOrder : o);
      await AsyncStorage.setItem('pendingOrders', JSON.stringify(updatedOrders));
    } catch (error) {
      console.error('Failed to update order in local storage:', error);
    }
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare order data for API
      const apiOrderData = {
        customer_name: orderData.shippingAddress.fullName,
        customer_email: 'mobile@user.com', // You can add this to orderData if needed
        customer_phone: orderData.shippingAddress.phoneNumber,
        shipping_address: `${orderData.shippingAddress.street}, ${orderData.shippingAddress.city}, ${orderData.shippingAddress.province} ${orderData.shippingAddress.postalCode}`,
        payment_method: selectedPaymentMethod,
        payment_status: 'paid',
        items: orderData.items.map(item => ({
          product_id: item.id,
          quantity: item.quantity || 1,
          price: item.price,
        })),
        subtotal: orderData.subtotal,
        shipping_fee: orderData.shippingFee,
        total: orderData.total,
        notes: 'Order from mobile app',
      };

      console.log('🔵 Sending order to API:', apiOrderData);

      // Send order to backend
      const response = await ApiService.createOrder(apiOrderData);
      
      console.log('🔵 Order created successfully:', response);

      const finalOrderData = {
        ...orderData,
        paymentMethod: selectedPaymentMethod,
        status: 'pending_confirmation',
        backendOrderId: response.data?.id, // Save backend order ID
      };

      // Also save locally for offline access
      await updateOrderInStorage(finalOrderData);
      setIsProcessing(false);
      
      // Payment successful
      Alert.alert('Success', 'Your order has been sent to the admin!', [
        {
          text: 'View Order',
          onPress: () => {
            clearCart();
            navigation.navigate('OrderDetails', { orderData: finalOrderData });
          },
        },
      ]);
    } catch (error) {
      console.error('🔴 Error creating order:', error);
      setIsProcessing(false);
      
      // Save locally even if API fails
      const finalOrderData = {
        ...orderData,
        paymentMethod: selectedPaymentMethod,
        status: 'pending_confirmation',
      };
      await updateOrderInStorage(finalOrderData);
      
      Alert.alert(
        'Order Saved Locally',
        'Order saved on your device. It will sync when connection is restored.',
        [
          {
            text: 'View Order',
            onPress: () => {
              clearCart();
              navigation.navigate('OrderDetails', { orderData: finalOrderData });
            },
          },
        ]
      );
    }
  };

  const total = (orderData.subtotal || 0) + (orderData.shippingFee || 0);
  const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
  const finalTotal = total + (selectedMethod?.fee || 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Payment Method</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₱{(orderData.subtotal || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>₱{(orderData.shippingFee || 0).toFixed(2)}</Text>
          </View>
          {selectedMethod && selectedMethod.fee > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Fee</Text>
              <Text style={styles.summaryValue}>₱{selectedMethod.fee.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>₱{finalTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                selectedPaymentMethod === method.id && styles.paymentMethodSelected,
              ]}
              onPress={() => setSelectedPaymentMethod(method.id)}
            >
              <View style={styles.paymentMethodIcon}>
                <Text style={styles.methodIcon}>{method.icon}</Text>
              </View>
              
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.methodName}>{method.name}</Text>
                <Text style={styles.methodDescription}>{method.description}</Text>
              </View>

              {method.fee > 0 && (
                <View style={styles.methodFee}>
                  <Text style={styles.feeText}>+₱{method.fee}</Text>
                </View>
              )}

              {selectedPaymentMethod === method.id && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkIcon}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Instructions */}
        {selectedPaymentMethod && (
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Payment Instructions</Text>
            {selectedPaymentMethod === 'gcash' && (
              <View style={styles.instructionsList}>
                <Text style={styles.instructionItem}>1. You will be redirected to GCash</Text>
                <Text style={styles.instructionItem}>2. Enter your GCash PIN to confirm</Text>
                <Text style={styles.instructionItem}>3. Payment will be processed instantly</Text>
              </View>
            )}
            {selectedPaymentMethod === 'credit_card' && (
              <View style={styles.instructionsList}>
                <Text style={styles.instructionItem}>1. You will be redirected to a secure payment page</Text>
                <Text style={styles.instructionItem}>2. Enter your card details</Text>
                <Text style={styles.instructionItem}>3. Complete the 3D Secure verification</Text>
              </View>
            )}
            {selectedPaymentMethod === 'bank_transfer' && (
              <View style={styles.instructionsList}>
                <Text style={styles.instructionItem}>1. We will provide bank details after confirmation</Text>
                <Text style={styles.instructionItem}>2. Transfer the amount to our account</Text>
                <Text style={styles.instructionItem}>3. Your order will be confirmed upon receipt</Text>
              </View>
            )}
          </View>
        )}

        {/* Security Notice */}
        <View style={styles.securityCard}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>Your payment information is encrypted and secure</Text>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.payButton,
            !selectedPaymentMethod && styles.payButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={!selectedPaymentMethod || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.payButtonText}>
              Pay ₱{finalTotal.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: 40,
  },
  backButton: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryTotal: {
    borderBottomWidth: 0,
    marginTop: 5,
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  paymentMethodSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139, 26, 26, 0.05)',
  },
  paymentMethodIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  methodIcon: {
    fontSize: 28,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 12,
    color: colors.textLight,
  },
  methodFee: {
    marginRight: 10,
  },
  feeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkIcon: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionsCard: {
    backgroundColor: 'rgba(139, 26, 26, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  instructionsList: {
    gap: 8,
  },
  instructionItem: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  securityCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  securityIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  securityText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  payButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
