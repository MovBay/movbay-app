// ReceiptGenerator.tsx
import React, { useRef } from 'react';
import { View, Text, StyleSheet, Share, Alert } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

interface ReceiptProps {
  transaction: {
    id: string;
    title: string;
    amount: number;
    date: string;
    status: "successful" | "pending" | "failed";
    type: "credit" | "debit";
    description: string;
    recipient: string;
    reference: string;
  };
}

export const ReceiptView = React.forwardRef<View, ReceiptProps>(({ transaction }, ref) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "successful":
        return "#22C55E";
      case "pending":
        return "#F59E0B";
      case "failed":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  return (
    <View ref={ref} style={styles.receiptContainer}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>YourApp</Text>
          </View>
        </View>
        <Text style={styles.receiptTitle}>Payment Receipt</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
            {transaction.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Amount Section */}
      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>
          {transaction.type === "credit" ? "Amount Received" : "Amount Paid"}
        </Text>
        <Text style={[styles.amount, { color: transaction.type === "credit" ? "#22C55E" : "#F75F15" }]}>
          {transaction.type === "credit" ? "+" : "-"}₦{Math.abs(transaction.amount).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Details Section */}
      <View style={styles.detailsSection}>
        <DetailRow label="Title" value={transaction.title} />
        <DetailRow label="Description" value={transaction.description} />
        <DetailRow label="Reference" value={transaction.reference} />
        <DetailRow label="Transaction Type" value={transaction.type === "credit" ? "Money In" : "Money Out"} />
        <DetailRow label="Date" value={formatDate(transaction.date)} />
        <DetailRow label="Time" value={formatTime(transaction.date)} />
        <DetailRow label="Transaction ID" value={`#${transaction.id}`} />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Thank you for using our service</Text>
        <Text style={styles.footerSubtext}>This is an electronic receipt</Text>
      </View>

      {/* Decorative Elements */}
      <View style={styles.decorativeTop} />
      <View style={styles.decorativeBottom} />
    </View>
  );
});

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

// Hook to handle receipt sharing
export const useReceiptShare = () => {
  const receiptRef = useRef<View>(null);

  const shareReceipt = async (transaction: any) => {
    try {
      if (!receiptRef.current) {
        Alert.alert('Error', 'Unable to generate receipt');
        return;
      }

      // Capture the receipt as an image
      const uri = await captureRef(receiptRef.current, {
        format: 'png',
        quality: 1,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Receipt',
        });
      } else {
        // Fallback to native share
        await Share.share({
          url: uri,
          message: `Transaction Receipt - ${transaction.reference}`,
        });
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to share receipt. Please try again.');
    }
  };

  return { receiptRef, shareReceipt };
};

const styles = StyleSheet.create({
  receiptContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    marginBottom: 12,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F75F15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  footerText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  decorativeTop: {
    position: 'absolute',
    top: 0,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F75F15',
    opacity: 0.05,
  },
  decorativeBottom: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#22C55E',
    opacity: 0.05,
  },
});