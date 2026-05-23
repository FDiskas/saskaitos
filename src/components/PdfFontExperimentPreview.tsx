import { PDFViewer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 32 },
  heading: { fontSize: 18, marginBottom: 12 },
  paragraph: { fontSize: 12, lineHeight: 1.4, marginBottom: 8 },
  bold: { fontSize: 12, lineHeight: 1.4, fontWeight: 700, marginBottom: 8 },
  caption: { fontSize: 9, marginTop: 16, color: '#666' },
});

const LITHUANIAN_SAMPLE =
  'Ąžuolas šneka garsiai: čia čėkavęs įsibrauna, šaltyšius rūko, Į žvėrį šniukštinėja.';
const ALPHABET = 'ąčęėįšųūž ĄČĘĖĮŠŲŪŽ';

interface Props {
  family: string;
}

export default function PdfFontExperimentPreview({ family }: Props) {
  return (
    <PDFViewer style={{ width: '100%', height: '70vh', border: 'none' }}>
      <Document>
        <Page size="A4" style={{ ...styles.page, fontFamily: family }}>
          <View>
            <Text style={styles.heading}>Šriftas: {family}</Text>
            <Text style={styles.paragraph}>Regular (400): {LITHUANIAN_SAMPLE}</Text>
            <Text style={styles.bold}>Bold (700): {LITHUANIAN_SAMPLE}</Text>
            <Text style={styles.paragraph}>Pilna LT abėcėlė: {ALPHABET}</Text>
            <Text style={styles.caption}>
              TTF kraunamas runtime iš fonts.gstatic.com — joks šrifto failas nesaugomas projekte.
            </Text>
          </View>
        </Page>
      </Document>
    </PDFViewer>
  );
}
