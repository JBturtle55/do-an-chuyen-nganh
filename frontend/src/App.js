import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider }    from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { RequireAuth, RequireAdmin } from './components/ProtectedRoute';
import Navbar      from './components/Navbar';
import Home        from './pages/Home';
import Search      from './pages/Search';
import Booking     from './pages/Booking';
import Login       from './pages/Login';
import Register    from './pages/Register';
import Admin       from './pages/Admin';
import Profile     from './pages/Profile';
import PaymentReturn  from './pages/PaymentReturn';
import Checkout       from './pages/Checkout';
import RouteProgress  from './components/RouteProgress';
import ForgotPassword from './pages/ForgotPassword';
import { NewsList, NewsDetail } from './pages/News';
import TicketPage    from './pages/TicketPage';
import NotFound      from './pages/NotFound';
import About         from './pages/About';
import Contact       from './pages/Contact';
import Terms         from './pages/Terms';
import Privacy       from './pages/Privacy';
import RefundPolicy  from './pages/RefundPolicy';
import { ToastProvider } from './components/Toast';
import ChatWidget     from './components/ChatWidget';
import Footer        from './components/Footer';

function Layout() {
  const { pathname } = useLocation();
  const { user, loading } = useAuth();
  const isAdmin = pathname.startsWith('/admin');

  // Admin vào trang user → redirect về /admin
  if (!loading && user?.role === 'admin' && !isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const noNav = isAdmin || pathname === '/login';
  return (
    <>
      <RouteProgress/>
      {!noNav && <Navbar/>}
      {!noNav && <ChatWidget/>}
    </>
  );
}

const NO_FOOTER = ['/login', '/register', '/forgot-password', '/payment/return'];
const NO_FOOTER_PREFIX = ['/admin', '/booking', '/checkout', '/ticket'];

function PageWrapper({ children }) {
  const { pathname } = useLocation();
  const noPad = pathname === '/' || pathname === '/login' || pathname.startsWith('/admin');
  const noFooter = NO_FOOTER.includes(pathname) || NO_FOOTER_PREFIX.some(p => pathname.startsWith(p));
  return (
    <div style={{ paddingTop: noPad ? 0 : 64 }}>
      {children}
      {!noFooter && <Footer/>}
    </div>
  );
}

export default function App() {
  return (
   <ToastProvider>
    <AuthProvider>
      <BrowserRouter>
        <Layout/>
        <PageWrapper>
        <Routes>
          <Route path="/"            element={<Home/>}/>
          <Route path="/search"      element={<Search/>}/>
          <Route path="/tin-tuc"     element={<NewsList/>}/>
          <Route path="/tin-tuc/:slug" element={<NewsDetail/>}/>
          <Route path="/login"           element={<Login/>}/>
          <Route path="/register"        element={<Register/>}/>
          <Route path="/forgot-password" element={<ForgotPassword/>}/>
          <Route path="/booking/:id"     element={<Booking/>}/>
          <Route path="/payment/return" element={<PaymentReturn/>}/>
          <Route path="/wallet"      element={<Navigate to="/profile" replace/>}/>
          <Route path="/checkout/:id" element={<RequireAuth><Checkout/></RequireAuth>}/>
          <Route path="/profile"     element={<RequireAuth><Profile/></RequireAuth>}/>
          <Route path="/ticket/:id"  element={<RequireAuth><TicketPage/></RequireAuth>}/>
          <Route path="/ve-chung-toi"          element={<About/>}/>
          <Route path="/lien-he"               element={<Contact/>}/>
          <Route path="/dieu-khoan"            element={<Terms/>}/>
          <Route path="/bao-mat"               element={<Privacy/>}/>
          <Route path="/chinh-sach-hoan-ve"    element={<RefundPolicy/>}/>
          <Route path="/admin"       element={<RequireAdmin><Admin/></RequireAdmin>}/>
          <Route path="*"            element={<NotFound/>}/>
        </Routes>
        </PageWrapper>
      </BrowserRouter>
    </AuthProvider>
  </ToastProvider>
  );
}
