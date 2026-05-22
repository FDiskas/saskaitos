import { StyleSheet } from '@react-pdf/renderer';

export const getPdfStyles = (primaryColor: string, accentColor: string) =>
  StyleSheet.create({
    page: {
      fontFamily: 'Roboto',
      fontSize: 10,
      lineHeight: 1.5,
      color: '#334155',
      padding: 40,
      position: 'relative',
    },
    background: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 30,
    },
    sellerCol: {
      flexDirection: 'column',
      maxWidth: '50%',
    },
    logo: {
      maxHeight: 45,
      maxWidth: 150,
      marginBottom: 8,
      objectFit: 'contain',
    },
    sectionTitle: {
      fontSize: 9,
      fontWeight: 'bold',
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4,
    },
    companyName: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#0f172a',
      marginBottom: 2,
    },
    infoText: {
      fontSize: 8.5,
      color: '#475569',
    },
    invoiceInfoCol: {
      alignItems: 'flex-end',
    },
    invoiceTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      color: primaryColor,
    },
    invoiceNo: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#0f172a',
      marginTop: 2,
      marginBottom: 10,
    },
    dateRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 5,
      fontSize: 8.5,
      color: '#475569',
    },
    dateLabel: {
      color: '#94a3b8',
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      marginBottom: 20,
    },
    buyerCol: {
      flexDirection: 'column',
      maxWidth: '50%',
      marginBottom: 20,
    },
    table: {
      flexDirection: 'column',
      marginTop: 10,
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#cbd5e1',
      paddingBottom: 6,
      marginBottom: 6,
    },
    thText: {
      fontSize: 8,
      fontWeight: 'bold',
      color: '#64748b',
      textTransform: 'uppercase',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
      paddingVertical: 6,
    },
    tdText: {
      fontSize: 9,
      color: '#0f172a',
    },
    colNr: { width: '8%', textAlign: 'center' },
    colDesc: { width: '42%', paddingRight: 10 },
    colQty: { width: '10%', textAlign: 'center' },
    colUnit: { width: '10%', textAlign: 'center' },
    colPrice: { width: '15%', textAlign: 'right' },
    colSum: { width: '15%', textAlign: 'right' },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    notesCol: {
      width: '50%',
    },
    notesText: {
      fontSize: 8.5,
      color: '#475569',
      lineHeight: 1.4,
    },
    totalsCol: {
      width: '40%',
      alignItems: 'flex-end',
      gap: 4,
    },
    totalLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      borderTopWidth: 1,
      borderTopColor: '#cbd5e1',
      paddingTop: 6,
      marginTop: 4,
    },
    totalText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: accentColor,
    },
    signatures: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 40,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: '#f1f5f9',
    },
    sigCol: {
      width: '40%',
    },
    sigTitle: {
      fontSize: 8.5,
      color: '#64748b',
      fontWeight: 'bold',
    },
    sigLine: {
      borderBottomWidth: 1,
      borderBottomColor: '#cbd5e1',
      marginTop: 35,
      marginBottom: 3,
    },
    sigSubtext: {
      fontSize: 7.5,
      color: '#94a3b8',
    },
  });
