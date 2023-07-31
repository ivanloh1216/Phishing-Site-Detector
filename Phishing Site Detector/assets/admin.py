import sys
from PyQt5 import QtCore, QtGui, QtWidgets
from urllib.parse import urlparse
from collections import Counter
import json

# Define the paths to the JSON files
whitelist_path = "whitelist.json"
blacklist_path = "blacklist.json"
pending_path = "pending.json"

# Load the JSON files
with open(whitelist_path, "r") as whitelist_file:
    whitelist = json.load(whitelist_file)

with open(blacklist_path, "r") as blacklist_file:
    blacklist = json.load(blacklist_file)

with open(pending_path, "r") as pending_file:
    pending = json.load(pending_file)

# Create a subclass of QMainWindow
class MainWindow(QtWidgets.QMainWindow):
    def __init__(self):
        super().__init__()

        self.setWindowTitle("URL Whitelisting/Blacklisting")
        self.setGeometry(100, 100, 1280, 800)  # Set the initial window size

        # Disable "Restore Down" functionality
        self.setWindowFlags(self.windowFlags() & ~QtCore.Qt.WindowMaximizeButtonHint)

        self.create_widgets()

    def create_widgets(self):
        # Create a widget for the main layout
        widget = QtWidgets.QWidget()
        layout = QtWidgets.QVBoxLayout(widget)

        # Create a scrollable table widget
        table_widget = QtWidgets.QTableWidget()
        table_widget.setHorizontalScrollBarPolicy(QtCore.Qt.ScrollBarAlwaysOff)  # Disable horizontal scroll
        table_widget.setColumnCount(2)  # Two columns: URL and count
        table_widget.setHorizontalHeaderLabels(["URL", "Report Counts"])

        # Add unique URLs with counts to the table widget
        url_counts = Counter(pending)
        table_widget.setRowCount(len(url_counts))
        for row, (url, count) in enumerate(url_counts.items()):
            url_label = QtWidgets.QLabel()
            url_label.setTextFormat(QtCore.Qt.RichText)
            url_label.setTextInteractionFlags(QtCore.Qt.TextBrowserInteraction)
            url_label.setText("<a href='{0}'>{0}</a>".format(url))
            url_label.setOpenExternalLinks(True)
            count_item = QtWidgets.QTableWidgetItem(str(count))
            url_label.setAlignment(QtCore.Qt.AlignJustify | QtCore.Qt.AlignVCenter)
            count_item.setFlags(count_item.flags() ^ QtCore.Qt.ItemIsEditable)  # Make the count cell non-editable
            table_widget.setCellWidget(row, 0, url_label)
            table_widget.setItem(row, 1, count_item)

        # Set the column widths and header properties
        table_widget.setColumnWidth(0, 1700)  # Set width for the URL column
        table_widget.horizontalHeader().setSectionResizeMode(QtWidgets.QHeaderView.Fixed)
        table_widget.horizontalHeader().setSectionResizeMode(1, QtWidgets.QHeaderView.Fixed)
        table_widget.horizontalHeader().setStretchLastSection(True)
        table_widget.horizontalHeader().setMinimumSectionSize(0)

        # Create the "No report URLs" label
        no_urls_label = QtWidgets.QLabel("No reported URLs at the moment.")
        no_urls_label.setAlignment(QtCore.Qt.AlignCenter)
        no_urls_label.setVisible(len(pending) == 0)  # Hide the label if there are URLs in pending.json
        no_urls_label.setStyleSheet("font-weight: bold; color: red; font-size: 16px;")

        layout.addWidget(no_urls_label)
        layout.addWidget(table_widget)

        # Function to handle the button click event
        def handle_whitelist():
            selected_row = table_widget.currentRow()
            if selected_row >= 0:
                url_label = table_widget.cellWidget(selected_row, 0)  # Get the QLabel widget
                url = url_label.text().split(">")[1].split("<")[0]  # Extract the URL from the QLabel text
                parsed_url = urlparse(url)
                domain = parsed_url.netloc  # Extract the domain from the URL
                domain = domain.replace("www.", "")  # Remove "www" prefix if present
                whitelist.append(domain)
                table_widget.removeRow(selected_row)  # Remove the row from the table

                # Remove all occurrences of the URL from the pending list
                global pending
                pending = [u for u in pending if u != url]

                # Update the JSON files
                with open(whitelist_path, "w") as whitelist_file:
                    json.dump(whitelist, whitelist_file, indent=2)
                with open(pending_path, "w") as pending_file:
                    json.dump(pending, pending_file, indent=2)

                if len(pending) == 0:
                    no_urls_label.setText("No report URLs at the moment.")
                    no_urls_label.show()  # Show the "No report URLs" message

        def handle_blacklist():
            selected_row = table_widget.currentRow()
            if selected_row >= 0:
                url_label = table_widget.cellWidget(selected_row, 0)  # Get the QLabel widget
                url = url_label.text().split(">")[1].split("<")[0]  # Extract the URL from the QLabel text
                parsed_url = urlparse(url)
                domain = parsed_url.netloc  # Extract the domain from the URL
                domain = domain.replace("www.", "")  # Remove "www" prefix if present
                blacklist.append(domain)
                table_widget.removeRow(selected_row)  # Remove the row from the table

                # Remove all occurrences of the URL from the pending list
                global pending
                pending = [u for u in pending if u != url]

                # Update the JSON files
                with open(blacklist_path, "w") as blacklist_file:
                    json.dump(blacklist, blacklist_file, indent=2)
                with open(pending_path, "w") as pending_file:
                    json.dump(pending, pending_file, indent=2)

                if len(pending) == 0:
                    no_urls_label.setText("No report URLs at the moment.")
                    no_urls_label.show()  # Show the "No report URLs" message

        # Create the "Whitelist" button
        whitelist_button = QtWidgets.QPushButton("Whitelist")
        whitelist_button.clicked.connect(handle_whitelist)
        layout.addWidget(whitelist_button)

        # Create the "Blacklist" button
        blacklist_button = QtWidgets.QPushButton("Blacklist")
        blacklist_button.clicked.connect(handle_blacklist)
        layout.addWidget(blacklist_button)

        # Set the main layout
        self.setCentralWidget(widget)

    # Handle the window close event to save the window state
    def closeEvent(self, event):
        QtCore.QSettings().setValue("windowState", self.saveState())

# Create the application
app = QtWidgets.QApplication(sys.argv)

# Create the main window
window = MainWindow()
window.showMaximized()  # Maximize the window on launch

# Start the application event loop
sys.exit(app.exec_())
