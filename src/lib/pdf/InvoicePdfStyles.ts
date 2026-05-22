import { StyleSheet } from '@react-pdf/renderer';

export interface PdfPalette {
  primaryColor: string;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  headingColor: string;
}

export const getPdfStyles = (palette: PdfPalette, fontFamily: string | readonly string[]) => {
  const { primaryColor, accentColor, textColor, mutedColor, borderColor, headingColor } = palette;
  return StyleSheet.create({
    page: {
      fontFamily: fontFamily as string | string[],
      fontSize: 10,
      lineHeight: 1.5,
      color: textColor,
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
    customImage: {
      maxWidth: '100%',
      objectFit: 'contain',
    },
    sectionTitle: {
      fontSize: 9,
      fontWeight: 'bold',
      color: headingColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4,
    },
    companyName: {
      fontSize: 11,
      fontWeight: 'bold',
      color: textColor,
      marginBottom: 2,
    },
    infoText: {
      fontSize: 8.5,
      color: mutedColor,
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
      color: textColor,
      marginTop: 2,
      marginBottom: 10,
    },
    dateRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 5,
      fontSize: 8.5,
      color: mutedColor,
    },
    dateLabel: {
      color: headingColor,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
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
      borderBottomColor: borderColor,
      paddingBottom: 6,
      marginBottom: 6,
    },
    thText: {
      fontSize: 8,
      fontWeight: 'bold',
      color: mutedColor,
      textTransform: 'uppercase',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
      paddingVertical: 6,
    },
    tdText: {
      fontSize: 9,
      color: textColor,
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
      color: mutedColor,
      lineHeight: 1.4,
    },
    totalsCol: {
      width: '100%',
      alignItems: 'flex-end',
      gap: 4,
    },
    totalsLabel: {
      fontSize: 9,
      color: mutedColor,
    },
    totalsValue: {
      fontSize: 9,
      fontWeight: 'bold',
      color: textColor,
    },
    totalLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      borderTopWidth: 1,
      borderTopColor: borderColor,
      paddingTop: 6,
      marginTop: 4,
    },
    totalLineLabel: {
      fontSize: 10,
      fontWeight: 'bold',
      color: textColor,
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
      borderTopColor: borderColor,
    },
    sigCol: {
      width: '40%',
    },
    sigTitle: {
      fontSize: 8.5,
      color: mutedColor,
      fontWeight: 'bold',
    },
    sigLine: {
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
      marginTop: 35,
      marginBottom: 3,
    },
    sigSubtext: {
      fontSize: 7.5,
      color: headingColor,
    },
  });
};
